import register from "./monitoring.js";
import {
 httpRequests,
 signupCounter,
 loginCounter,
 failedLoginCounter
} from "./monitoring.js";
import multer from "multer";
import cors from "cors";
import express from "express";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { User, Report, FileUpload, Review } from "./models.js";
import dotenv from "dotenv";
dotenv.config();

const app = express();


app.use((req,res,next)=>{
  res.on("finish",()=>{
    httpRequests.inc({
      method:req.method,
      route:req.path,
      status:res.statusCode
    });
  });

  next();
});


app.get("/metrics", async(req,res)=>{
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});
const PORT = Number(process.env.PORT || 5050);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const EXTRA_ORIGINS = (process.env.EXTRA_ORIGINS || "").split(",").map((v) => v.trim()).filter(Boolean);
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/dakaai";
const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_jwt_key_change_this_in_production";

const NVIDIA_API_URL = process.env.NVIDIA_API_URL || "https://integrate.api.nvidia.com/v1/chat/completions";
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_MODEL = process.env.NVIDIA_MODEL || "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning";
const NVIDIA_MAX_TOKENS = Number(process.env.NVIDIA_MAX_TOKENS || 65536);
const NVIDIA_TEMPERATURE = Number(process.env.NVIDIA_TEMPERATURE || 0.6);
const NVIDIA_TOP_P = Number(process.env.NVIDIA_TOP_P || 0.95);
const NVIDIA_ENABLE_THINKING = (process.env.NVIDIA_ENABLE_THINKING || "true").toLowerCase() === "true";
const NVIDIA_REASONING_BUDGET = Number(process.env.NVIDIA_REASONING_BUDGET || 16384);

// MongoDB connection
mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 }).catch((err) => {
  console.error("⚠️  MongoDB connection error:", err.message);
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Missing authorization token" });
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Add health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", port: PORT });
});

// Enhanced CORS configuration - must be before routes
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      CLIENT_ORIGIN,
      ...EXTRA_ORIGINS,
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:8080',
      'http://localhost:8080',
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`❌ CORS rejected origin: ${origin}`);
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type'],
  optionsSuccessStatus: 200,
  maxAge: 86400
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Log CORS configuration on startup
console.log(`✅ CORS enabled for origins: ${corsOptions.origin.toString().substring(0, 100)}...`);
app.use(express.json({ limit: "10mb" }));

// ==================== AUTH ENDPOINTS ====================

// Signup
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: "Email already in use" });
    }

    const user = new User({ email: email.toLowerCase(), password, displayName: displayName || email });
    await user.save();

    const token = jwt.sign({ userId: user._id.toString(), email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ token, user: { _id: user._id, email: user.email, displayName: user.displayName } });
  } catch (err) {
    res.status(500).json({ error: "Signup failed" });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id.toString(), email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { _id: user._id, email: user.email, displayName: user.displayName } });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

// Get current user
app.get("/api/auth/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ _id: user._id, email: user.email, displayName: user.displayName });
  } catch (err) {
    res.status(500).json({ error: "Failed to get user" });
  }
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const buildMessages = ({ system, user }) => {
  const messages = [];
  if (system) messages.push({ role: "system", content: system });
  if (user) messages.push({ role: "user", content: user });
  return messages;
};

const buildExtraBody = ({ disableThinking = false } = {}) => {
  if (disableThinking) {
    return {
      chat_template_kwargs: { enable_thinking: false },
    };
  }
  if (!NVIDIA_ENABLE_THINKING && !NVIDIA_REASONING_BUDGET) return undefined;
  return {
    chat_template_kwargs: { enable_thinking: NVIDIA_ENABLE_THINKING },
    reasoning_budget: NVIDIA_REASONING_BUDGET || undefined,
  };
};

const callNvidiaChat = async ({
  messages,
  stream = false,
  temperature = NVIDIA_TEMPERATURE,
  maxTokens = NVIDIA_MAX_TOKENS,
  timeoutMs = 60000,
  disableThinking = false,
}) => {
  if (!NVIDIA_API_KEY) {
    throw new Error("Missing NVIDIA_API_KEY");
  }

  const extraBody = buildExtraBody({ disableThinking });

  const payload = {
    model: NVIDIA_MODEL,
    messages,
    temperature,
    top_p: NVIDIA_TOP_P,
    max_tokens: maxTokens,
    stream,
    ...(extraBody ? { extra_body: extraBody } : {}),
  };

  try {
    console.log(`🔄 Calling NVIDIA API (${NVIDIA_MODEL})...`);
    
    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    const resp = await fetch(NVIDIA_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NVIDIA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!resp.ok) {
      const errorText = await resp.text().catch(() => "");
      console.error(`❌ NVIDIA API error: ${resp.status}`, errorText.substring(0, 500));
      throw new Error(`NVIDIA API error: ${resp.status} ${errorText.substring(0, 200)}`);
    }

    console.log(`✅ NVIDIA API response received (${resp.status})`);
    return resp;
  } catch (err) {
    if (err.name === "AbortError") {
      console.error("❌ NVIDIA API call timeout (60s)");
      throw new Error("NVIDIA API request timeout - please try again");
    }
    console.error("❌ NVIDIA API call failed:", err.message);
    throw err;
  }
};

const extractJsonFromMixedContent = (text) => {
  if (!text || typeof text !== 'string') return null;
  
  // Strategy 1: Find all complete JSON blocks with proper brace matching
  const positions = [];
  let braceDepth = 0;
  let inString = false;
  let escapeNext = false;
  let startPos = -1;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    
    if (char === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }
    
    if (!inString) {
      if (char === '{') {
        if (braceDepth === 0) startPos = i;
        braceDepth++;
      } else if (char === '}') {
        braceDepth--;
        if (braceDepth === 0 && startPos >= 0) {
          positions.push({ start: startPos, end: i });
          startPos = -1;
        }
      }
    }
  }
  
  // Try each JSON block, prioritizing larger ones first
  const sorted = positions.sort((a, b) => (b.end - b.start) - (a.end - a.start));
  for (const pos of sorted) {
    const jsonStr = text.substring(pos.start, pos.end + 1);
    try {
      const parsed = JSON.parse(jsonStr);
      // Validate that it has meaningful content (at least 2 keys)
      if (Object.keys(parsed).length > 1) {
        return parsed;
      }
    } catch (e) {
      // Try next block
    }
  }
  
  return null;
};


const safeJsonParse = (text) => {
  if (!text || typeof text !== 'string') return null;
  
  // Try direct parse first
  try {
    return JSON.parse(text);
  } catch (e) {
    // Ignore and try recovery methods
  }
  
  // Try intelligent extraction from mixed content
  const extracted = extractJsonFromMixedContent(text);
  if (extracted) return extracted;
  
  // Fallback to greedy extraction
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      // Try to repair incomplete JSON by adding closing braces
      let repaired = jsonMatch[0];
      const openBraces = (repaired.match(/\{/g) || []).length;
      const closeBraces = (repaired.match(/\}/g) || []).length;
      const missingBraces = openBraces - closeBraces;
      
      if (missingBraces > 0) {
        repaired += '}' .repeat(missingBraces);
        try {
          return JSON.parse(repaired);
        } catch (e2) {
          console.error("Failed to parse even after repair:", e2.message.substring(0, 100));
          return null;
        }
      }
      return null;
    }
  }
  
  // Try to find JSON array
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      return JSON.parse(arrayMatch[0]);
    } catch (e) {
      return null;
    }
  }
  
  return null;
};


app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// Test NVIDIA API connectivity
app.post("/api/test-nvidia", async (req, res) => {
  try {
    console.log("🧪 Testing NVIDIA API connectivity...");
    
    const testPayload = {
      model: NVIDIA_MODEL,
      messages: [{ role: "user", content: "Hello" }],
      temperature: 0.5,
      top_p: 0.95,
      max_tokens: 100,
      stream: false,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const resp = await fetch(NVIDIA_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NVIDIA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testPayload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (resp.ok) {
      const data = await resp.json();
      console.log("✅ NVIDIA API is working!");
      res.json({ 
        status: "ok", 
        message: "NVIDIA API is responding",
        model: NVIDIA_MODEL 
      });
    } else {
      const error = await resp.text().catch(() => "");
      console.error(`❌ NVIDIA API returned ${resp.status}:`, error);
      res.status(502).json({ 
        status: "error", 
        statusCode: resp.status,
        message: error.substring(0, 500)
      });
    }
  } catch (err) {
    console.error("❌ NVIDIA API test failed:", err.message);
    res.status(502).json({ 
      status: "error",
      message: err.message 
    });
  }
});

app.post("/api/parse-document", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const filename = req.file.originalname.toLowerCase();
    const ext = path.extname(filename);

    if (ext === ".txt" || ext === ".md") {
      const text = req.file.buffer.toString("utf-8");
      res.json({ text });
      return;
    }

    if (ext === ".pdf") {
      const data = await pdfParse(req.file.buffer);
      res.json({ text: data.text || "" });
      return;
    }

    if (ext === ".docx") {
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      res.json({ text: result.value || "" });
      return;
    }

    res.status(400).json({ error: "Unsupported file type" });
  } catch (error) {
    res.status(500).json({ error: "Failed to parse document" });
  }
});

app.post("/api/review-thesis", async (req, res) => {
  try {
    const { title, text, format } = req.body || {};
    if (!text) {
      res.status(400).json({ error: "Missing thesis text" });
      return;
    }

    const system =
      "You are an academic thesis examiner. Provide a structured, comprehensive review with sections: Summary, Strengths, Weaknesses, Methodology, Literature, Results, Formatting/Citations, and Actionable Recommendations.";
    const userPrompt = `Title: ${title || "Untitled"}\nCitation Format: ${format || "APA"}\n\nThesis Text:\n${text}`;

    const nvidiaResp = await callNvidiaChat({
      messages: [
        { role: "system", content: system },
        { role: "user", content: userPrompt },
      ],
      stream: true,
      maxTokens: 2000,
      timeoutMs: 90000,
      disableThinking: true,
    });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const reader = nvidiaResp.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(decoder.decode(value, { stream: true }));
      }
    } catch (e) {
      console.error("Stream error:", e.message);
    }

    res.end();
  } catch (error) {
    console.error("Review error:", error.message);
    res.status(500).json({ error: "Failed to review thesis" });
  }
});

app.post("/api/chat-assistant", async (req, res) => {
  try {
    const { messages } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "Missing messages" });
      return;
    }

    const nvidiaResp = await callNvidiaChat({
      messages,
      stream: true,
      maxTokens: NVIDIA_MAX_TOKENS,
    });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const reader = nvidiaResp.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(decoder.decode(value, { stream: true }));
      }
    } catch (e) {
      console.error("Stream error:", e.message);
    }

    res.end();
  } catch (error) {
    console.error("Chat error:", error.message);
    res.status(500).json({ error: "Failed to generate chat response" });
  }
});

app.post("/api/score-thesis", async (req, res) => {
  try {
    const { title, text, format } = req.body || {};
    if (!text) {
      res.status(400).json({ error: "Missing thesis text" });
      return;
    }

    const system = `You are an academic evaluator. YOU MUST respond with ONLY valid JSON (no other text before or after).
The JSON must have this exact structure:
{
  "scores": {
    "thesisTitle": {"score": <0-10>, "max": 10, "justification": "<text>"},
    "researchProblem": {"score": <0-10>, "max": 10, "justification": "<text>"},
    "researchObjectives": {"score": <0-10>, "max": 10, "justification": "<text>"},
    "literatureReview": {"score": <0-10>, "max": 10, "justification": "<text>"},
    "researchMethodology": {"score": <0-10>, "max": 10, "justification": "<text>"},
    "originality": {"score": <0-10>, "max": 10, "justification": "<text>"},
    "referencing": {"score": <0-10>, "max": 10, "justification": "<text>"},
    "format": {"score": <0-10>, "max": 10, "justification": "<text>"},
    "presentationLanguageStyle": {"score": <0-10>, "max": 10, "justification": "<text>"},
    "resultsAndFindings": {"score": <0-10>, "max": 10, "justification": "<text>"},
    "summaryConclusions": {"score": <0-10>, "max": 10, "justification": "<text>"}
  },
  "totalScore": <0-100>,
  "recommendation": "<Recommendation status>",
  "overallComments": "<Summary of evaluation>"
}
CRITICAL: Respond ONLY with valid JSON, nothing else.`;

    const userPrompt = `Evaluate this thesis and return ONLY valid JSON (no text before/after):
Title: ${title || "Untitled"}
Format: ${format || "APA"}

Thesis: ${text}`;

    const resp = await callNvidiaChat({
      messages: buildMessages({ system, user: userPrompt }),
      stream: false,
      temperature: 0.2,
      maxTokens: 1000,
      timeoutMs: 90000,
      disableThinking: true,
    });

    const raw = await resp.text();
    const data = safeJsonParse(raw) || {};
    const content =
      data?.choices?.[0]?.message?.content ||
      data?.choices?.[0]?.message?.reasoning ||
      data?.choices?.[0]?.delta?.content ||
      data?.choices?.[0]?.text ||
      "";
    
    if (!content) {
      console.error("Empty response from NVIDIA API for score-thesis:", raw.substring(0, 500));
      res.status(502).json({ error: "Empty response from AI service" });
      return;
    }
    
    // Log content before parsing for debugging
    console.log("📝 Raw content for parsing (first 300 chars):", typeof content === 'string' ? content.substring(0, 300) : content);
    
    let parsed = safeJsonParse(content);

    if (!parsed) {
      console.error("❌ Failed to parse JSON from score-thesis response:", content.substring(0, 300));
      console.error("   Content type:", typeof content);
      console.error("   Content length:", content.length);
      console.warn("⚠️  Content is not JSON, attempting to extract evaluation data...");
      
      // Try to generate JSON from text response by making another request for JSON conversion
      try {
        const conversionResp = await callNvidiaChat({
          messages: buildMessages({
            system: `You are a JSON converter. Convert this evaluation text into ONLY valid JSON (no other text). Use this exact structure:
{
  "scores": {
    "thesisTitle": {"score": <0-10>, "max": 10, "justification": "<text>"},
    "researchProblem": {"score": <0-10>, "max": 10, "justification": "<text>"},
    "researchObjectives": {"score": <0-10>, "max": 10, "justification": "<text>"},
    "literatureReview": {"score": <0-10>, "max": 10, "justification": "<text>"},
    "researchMethodology": {"score": <0-10>, "max": 10, "justification": "<text>"},
    "originality": {"score": <0-10>, "max": 10, "justification": "<text>"},
    "referencing": {"score": <0-10>, "max": 10, "justification": "<text>"},
    "format": {"score": <0-10>, "max": 10, "justification": "<text>"},
    "presentationLanguageStyle": {"score": <0-10>, "max": 10, "justification": "<text>"},
    "resultsAndFindings": {"score": <0-10>, "max": 10, "justification": "<text>"},
    "summaryConclusions": {"score": <0-10>, "max": 10, "justification": "<text>"}
  },
  "totalScore": <0-100>,
  "recommendation": "<status>",
  "overallComments": "<summary>"
}`,
            user: `Convert to JSON: ${content}`,
          }),
          stream: false,
          temperature: 0.2,
          maxTokens: 1000,
          timeoutMs: 30000,
          disableThinking: true,
        });
        
        const conversionRaw = await conversionResp.text();
        const conversionData = safeJsonParse(conversionRaw) || {};
        const conversionContent = conversionData?.choices?.[0]?.message?.content || "";
        
        if (conversionContent) {
          parsed = safeJsonParse(conversionContent);
        }
      } catch (e) {
        console.warn("⚠️  JSON conversion also failed:", e.message);
      }
      
      // If still no parsed data, use fallback
      if (!parsed) {
        console.warn("⚠️  Using default fallback response");
        
        // Return fallback response with default scores
        res.json({
          scores: {
            thesisTitle: { score: 5, max: 10, justification: "Unable to evaluate - AI service issue" },
            researchProblem: { score: 5, max: 10, justification: "Unable to evaluate - AI service issue" },
            researchObjectives: { score: 5, max: 10, justification: "Unable to evaluate - AI service issue" },
            literatureReview: { score: 5, max: 10, justification: "Unable to evaluate - AI service issue" },
            researchMethodology: { score: 5, max: 10, justification: "Unable to evaluate - AI service issue" },
            originality: { score: 5, max: 10, justification: "Unable to evaluate - AI service issue" },
            referencing: { score: 5, max: 10, justification: "Unable to evaluate - AI service issue" },
            format: { score: 5, max: 10, justification: "Unable to evaluate - AI service issue" },
            presentationLanguageStyle: { score: 5, max: 10, justification: "Unable to evaluate - AI service issue" },
            resultsAndFindings: { score: 5, max: 10, justification: "Unable to evaluate - AI service issue" },
            summaryConclusions: { score: 5, max: 10, justification: "Unable to evaluate - AI service issue" }
          },
          totalScore: 50,
          recommendation: "Please try again",
          overallComments: "The AI service encountered an error. Please resubmit your thesis for evaluation."
        });
        return;
      }
    }

    // Ensure all required fields exist
    const scores = parsed.scores || {};
    
    // Calculate totalScore if not provided or is 0
    let totalScore = parsed.totalScore || 0;
    if (totalScore === 0 && Object.keys(scores).length > 0) {
      const scoreValues = Object.values(scores).filter(s => s && typeof s === 'object' && 'score' in s);
      if (scoreValues.length > 0) {
        const total = scoreValues.reduce((sum, s) => sum + (s.score || 0), 0);
        const maxTotal = scoreValues.reduce((sum, s) => sum + (s.max || 10), 0);
        totalScore = Math.round((total / maxTotal) * 100) || 0;
      }
    }
    
    parsed = {
      scores,
      totalScore,
      recommendation: parsed.recommendation || "Requires revisions",
      overallComments: parsed.overallComments || "Please provide more detailed content."
    };

    res.json(parsed);
  } catch (error) {
    console.error("Score thesis error:", error.message);
    const message = error.message.includes("timeout") 
      ? "AI service is taking too long. Please try again."
      : error.message.includes("NVIDIA API")
      ? `AI service error: ${error.message}`
      : "Failed to score thesis. Please try again.";
    res.status(502).json({ error: message });
  }
});

app.post("/api/detect-ai", async (req, res) => {
  try {
    const { title, text } = req.body || {};
    if (!text) {
      res.status(400).json({ error: "Missing thesis text" });
      return;
    }

    const system = `You are an AI content detector. YOU MUST respond with ONLY valid JSON (no other text before or after).
The JSON must have this exact structure:
{
  "overallAiScore": <0-100>,
  "humanScore": <0-100>,
  "confidence": <0-1>,
  "verdict": "<human|ai|mixed|unknown>",
  "signals": {
    "repetitivePatterns": {"score": <0-100>, "evidence": "<text>"},
    "vocabularyUniformity": {"score": <0-100>, "evidence": "<text>"},
    "hedgingOveruse": {"score": <0-100>, "evidence": "<text>"},
    "lackOfPersonalVoice": {"score": <0-100>, "evidence": "<text>"},
    "structurePredictability": {"score": <0-100>, "evidence": "<text>"},
    "burstiness": {"score": <0-100>, "evidence": "<text>"},
    "perplexity": {"score": <0-100>, "evidence": "<text>"},
    "clicheDensity": {"score": <0-100>, "evidence": "<text>"},
    "citationAuthenticity": {"score": <0-100>, "evidence": "<text>"},
    "depthVsBreadth": {"score": <0-100>, "evidence": "<text>"}
  },
  "flaggedPassages": [{"text": "<passage>", "reason": "<reason>"}],
  "summary": "<brief summary>"
}
CRITICAL: Respond ONLY with valid JSON, nothing else.`;

    const userPrompt = `Analyze this text for AI-like patterns. Provide ONLY valid JSON (no other text):
Title: ${title || "Untitled"}
Text: ${text}`;

    const resp = await callNvidiaChat({
      messages: buildMessages({ system, user: userPrompt }),
      stream: false,
      temperature: 0.3,
      maxTokens: 1000,
      timeoutMs: 90000,
      disableThinking: true,
    });

    const raw = await resp.text();
    const data = safeJsonParse(raw) || {};
    const content =
      data?.choices?.[0]?.message?.content ||
      data?.choices?.[0]?.message?.reasoning ||
      data?.choices?.[0]?.delta?.content ||
      data?.choices?.[0]?.text ||
      "";
    
    if (!content) {
      console.error("Empty response from NVIDIA API for detect-ai:", raw.substring(0, 500));
      res.status(502).json({ error: "Empty response from AI service" });
      return;
    }
    
    console.log("📝 Raw content for detect-ai parsing (first 300 chars):", typeof content === 'string' ? content.substring(0, 300) : content);
    
    let parsed = safeJsonParse(content);

    if (!parsed) {
      console.error("❌ Failed to parse JSON from detect-ai response:", content.substring(0, 300));
      console.error("   Content type:", typeof content);
      console.error("   Content length:", content.length);
      console.warn("⚠️  Using default fallback response");
      
      // Return fallback response
      res.json({
        overallAiScore: 50,
        humanScore: 50,
        confidence: 0.5,
        verdict: "Unable to determine",
        signals: {
          repetitivePatterns: { score: 50, evidence: "Could not analyze - AI service error" },
          vocabularyUniformity: { score: 50, evidence: "Could not analyze - AI service error" },
          hedgingOveruse: { score: 50, evidence: "Could not analyze - AI service error" },
          lackOfPersonalVoice: { score: 50, evidence: "Could not analyze - AI service error" },
          structurePredictability: { score: 50, evidence: "Could not analyze - AI service error" },
          burstiness: { score: 50, evidence: "Could not analyze - AI service error" },
          perplexity: { score: 50, evidence: "Could not analyze - AI service error" },
          clicheDensity: { score: 50, evidence: "Could not analyze - AI service error" },
          citationAuthenticity: { score: 50, evidence: "Could not analyze - AI service error" },
          depthVsBreadth: { score: 50, evidence: "Could not analyze - AI service error" }
        },
        flaggedPassages: [],
        summary: "AI detection analysis failed. Please try again later."
      });
      return;
    }

    // Ensure all required fields exist
    parsed = {
      overallAiScore: parsed.overallAiScore || 0,
      humanScore: parsed.humanScore || 100,
      confidence: parsed.confidence || 0,
      verdict: parsed.verdict || "Unable to determine",
      signals: parsed.signals || {},
      flaggedPassages: parsed.flaggedPassages || [],
      summary: parsed.summary || "Analysis complete"
    };

    res.json(parsed);
  } catch (error) {
    console.error("Detect AI error:", error.message);
    const message = error.message.includes("timeout") 
      ? "AI service is taking too long. Please try again."
      : error.message.includes("NVIDIA API")
      ? `AI service error: ${error.message}`
      : "Failed to detect AI content. Please try again.";
    res.status(502).json({ error: message });
  }
});

// Get user reports
app.get("/api/reports", verifyToken, async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.user.userId }).sort({ createdAt: -1 }).lean();
    res.json(reports);
  } catch (error) {
    console.error("Fetch reports error:", error.message);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

// Create report (replaces old reviews endpoint)
app.post("/api/reports", verifyToken, async (req, res) => {
  const { thesisTitle, thesisText, reviewContent, reportType } = req.body || {};
  if (!reviewContent) {
    res.status(400).json({ error: "Missing reviewContent" });
    return;
  }

  try {
    const report = await Report.create({
      userId: req.user.userId,
      thesisTitle: thesisTitle || "Untitled Thesis",
      thesisText: thesisText || "",
      reviewContent,
      reportType: reportType || "review",
    });
    res.json(report);
  } catch (error) {
    console.error("Create report error:", error.message);
    res.status(500).json({ error: "Failed to save report" });
  }
});

// Delete report
app.delete("/api/reports/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await Report.findOneAndDelete({ _id: id, userId: req.user.userId });

    if (!result) {
      res.status(404).json({ error: "Report not found" });
      return;
    }

    res.json({ ok: true });
  } catch (error) {
    console.error("Delete report error:", error.message);
    res.status(500).json({ error: "Failed to delete report" });
  }
});

// Legacy endpoints for backward compatibility
app.get("/api/reviews", async (req, res) => {
  const userId = String(req.query.userId || "");
  if (!userId) {
    res.status(400).json({ error: "Missing userId" });
    return;
  }

  try {
    const reviews = await Review.find({ userId }).sort({ createdAt: -1 }).lean();
    res.json(reviews);
  } catch (error) {
    console.error("Fetch reviews error:", error.message);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

app.post("/api/reviews", async (req, res) => {
  const { userId, thesisTitle, thesisText, reviewContent } = req.body || {};
  if (!userId || !reviewContent) {
    res.status(400).json({ error: "Missing userId or reviewContent" });
    return;
  }

  try {
    const record = await Review.create({
      userId,
      thesisTitle: thesisTitle || "Untitled Thesis",
      thesisText: thesisText || "",
      reviewContent,
    });
    res.json(record);
  } catch (error) {
    console.error("Create review error:", error.message);
    res.status(500).json({ error: "Failed to save review" });
  }
});

app.delete("/api/reviews/:id", async (req, res) => {
  const userId = String(req.query.userId || "");
  const { id } = req.params;

  if (!userId) {
    res.status(400).json({ error: "Missing userId" });
    return;
  }

  try {
    const result = await Review.findOneAndDelete({ _id: id, userId });

    if (!result) {
      res.status(404).json({ error: "Review not found" });
      return;
    }

    res.json({ ok: true });
  } catch (error) {
    console.error("Delete review error:", error.message);
    res.status(500).json({ error: "Failed to delete review" });
  }

});
app.get("/metrics", async(req,res)=>{

res.setHeader(
"Content-Type",
register.contentType
);

res.end(
await register.metrics()
);

});
app.listen(PORT, () => {
  console.log(`✅ Backend listening on http://localhost:${PORT}`);
  console.log(`🗄️  MongoDB: ${MONGODB_URI}`);
  console.log(`🤖 NVIDIA Model: ${NVIDIA_MODEL}`);
  console.log(`💭 Thinking enabled: ${NVIDIA_ENABLE_THINKING}`);
});
