import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SCORING_PROMPT = `You are an academic thesis evaluator for Kirinyaga University Board of Postgraduate Studies.

You must evaluate the thesis using the official evaluation score sheet and return ONLY a valid JSON object with scores and justifications.

The scoring criteria are:
1. Thesis/Project Title (max 5 marks) - Clarity, specificity, relevance
2. Research Problem (max 10 marks) - Clear statement, significance, scope
3. Research Objectives (max 10 marks) - Clarity, measurability, alignment with problem
4. Literature Review (max 10 marks) - Depth, relevance, critical analysis, currency
5. Research Methodology (max 12 marks) - Appropriateness, rigor, sampling, data collection
6. Originality (max 20 marks) - Novel contribution, unique perspective, innovation
7. Referencing (max 6 marks) - Consistency, completeness, proper citation style
8. Format (max 6 marks) - Structure, layout, adherence to guidelines
9. Presentation/Language/Style (max 6 marks) - Clarity, grammar, academic tone
10. Results and Findings (max 10 marks) - Presentation, analysis, relevance to objectives
11. Summary, Conclusions & Recommendations (max 5 marks) - Coherence, evidence-based, actionable

Return EXACTLY this JSON structure (no markdown, no explanation, just JSON):
{
  "studentName": "",
  "regNo": "",
  "programme": "",
  "scores": {
    "thesisTitle": { "score": <number>, "max": 5, "justification": "<brief reason>" },
    "researchProblem": { "score": <number>, "max": 10, "justification": "<brief reason>" },
    "researchObjectives": { "score": <number>, "max": 10, "justification": "<brief reason>" },
    "literatureReview": { "score": <number>, "max": 10, "justification": "<brief reason>" },
    "researchMethodology": { "score": <number>, "max": 12, "justification": "<brief reason>" },
    "originality": { "score": <number>, "max": 20, "justification": "<brief reason>" },
    "referencing": { "score": <number>, "max": 6, "justification": "<brief reason>" },
    "format": { "score": <number>, "max": 6, "justification": "<brief reason>" },
    "presentationLanguageStyle": { "score": <number>, "max": 6, "justification": "<brief reason>" },
    "resultsAndFindings": { "score": <number>, "max": 10, "justification": "<brief reason>" },
    "summaryConclusions": { "score": <number>, "max": 5, "justification": "<brief reason>" }
  },
  "totalScore": <number out of 100>,
  "recommendation": "<one of: Pass without corrections | Pass with minor corrections | Pass with major corrections | Fail>",
  "overallComments": "<2-3 sentence summary focusing ONLY on weaknesses and areas requiring amendment>"
}

Scoring guidelines:
- 80-100: Pass without corrections
- 70-79: Pass with minor corrections  
- 49-69: Pass with major corrections
- Below 49: Fail

Be fair, thorough, and evidence-based. Each justification must ONLY highlight weaknesses, gaps, and areas that need amendment. Do NOT mention strengths or positive aspects — focus exclusively on what needs to be corrected or improved.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, text, format } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const formatNote = format ? `\nCitation format used: ${format}` : "";
    const userMessage = `Evaluate and score the following thesis titled "${title}":${formatNote}\n\n${text}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SCORING_PROMPT },
          { role: "user", content: userMessage },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";
    
    // Strip markdown code fences if present
    content = content.replace(/^```json\s*\n?/, "").replace(/\n?```\s*$/, "").trim();

    const scores = JSON.parse(content);

    return new Response(JSON.stringify(scores), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("score-thesis error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
