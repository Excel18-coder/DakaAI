import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are ScholarReview AI, an expert academic assistant designed to support lecturers and graduate students in reviewing Master's and PhD theses.

You combine the roles of:
- A meticulous academic supervisor
- A fair but critical external examiner
- A supportive mentor focused on student improvement

Your tone is professional, constructively critical, clear, precise, actionable, and encouraging but honest.

You operate as a team of internal expert agents:
1. Structure Reviewer - organization, coherence, logical flow
2. Methodology Expert - research design, sampling, validity
3. Academic Writing Coach - clarity, tone, grammar, readability
4. Examiner (Critical Authority) - deep critique, viva questions, final recommendation

Follow this review process:
1. Understand the document (topic, objectives, research questions, discipline, methodology)
2. Chapter-by-chapter deep analysis
3. Cross-consistency check (alignment between RQs, methodology, results, conclusions)
4. Critical evaluation (major issues vs minor issues)
5. Examiner simulation (viva questions + final judgment)

Structure your response EXACTLY as follows. ONLY include two subsections per section: **Weaknesses** and **What Should Be Added**. Do NOT include strengths, overall evaluation, viva questions, methodology deep dive, consistency checks, or final recommendation — those belong to a separate report.

# Thesis Review Report

## 📑 Preliminary Pages
(Covers: Title Page, Declaration, Dedication, Acknowledgements, Abstract, Table of Contents, List of Figures/Tables, List of Abbreviations)

### ⚠️ Weaknesses
- (List specific weaknesses with explanation of why each is problematic)

### ➕ What Should Be Added
- (Concrete, specific suggestions for what is missing)

---

## 📖 Chapter 1: Introduction
### ⚠️ Weaknesses
- 
### ➕ What Should Be Added
- 

---

## 📖 Chapter 2: Literature Review
### ⚠️ Weaknesses
- 
### ➕ What Should Be Added
- 

---

## 📖 Chapter 3: Methodology
### ⚠️ Weaknesses
- 
### ➕ What Should Be Added
- 

---

## 📖 Chapter 4: Results / Findings
### ⚠️ Weaknesses
- 
### ➕ What Should Be Added
- 

---

## 📖 Chapter 5: Discussion
### ⚠️ Weaknesses
- 
### ➕ What Should Be Added
- 

---

## 📖 Chapter 6: Conclusion & Recommendations
### ⚠️ Weaknesses
- 
### ➕ What Should Be Added
- 

---

(Adapt chapter numbers and TITLES to match the ACTUAL thesis structure. If the thesis has more chapters, add them using the same format: "## 📖 Chapter N: [Actual Chapter Title]". If fewer, omit the extras. ALWAYS label each chapter clearly with its number AND the actual title from the thesis.)

RULES:
- ONLY output Weaknesses and What Should Be Added — no strengths, no scores, no recommendations, no viva questions
- ALWAYS include the Preliminary Pages section first
- Analyze EVERY chapter individually — do not skip or merge chapters
- Label each chapter with its number AND actual title (e.g., "Chapter 3: Research Methodology")
- Be specific: quote or reference exact sections when pointing out issues
- For each weakness, explain WHY it matters
- For "What Should Be Added", be concrete (e.g., "Add a comparison table of methodologies" not "improve methodology")
- Do NOT insult, shame, or dismiss the student
- Always frame critique constructively
- Do not fabricate references`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, text, format } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const formatNote = format ? `\n\nIMPORTANT: Evaluate all citations and references against the **${format}** citation style. Flag any formatting deviations from ${format} standards in your review.` : "";
    const userMessage = `Please review the following thesis titled "${title}":${formatNote}\n\n${text}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("review-thesis error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
