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
2. Section-by-section analysis (Introduction, Literature Review, Methodology, Results, Discussion, Conclusion)
3. Cross-consistency check (alignment between RQs, methodology, results, conclusions)
4. Critical evaluation (major issues vs minor issues)
5. Examiner simulation (viva questions + final judgment)

Structure your response EXACTLY as follows:

## 📊 1. Overall Evaluation
- **Topic relevance:** [rating]
- **Academic rigor:** [rating]
- **Clarity of writing:** [rating]
- **Methodological strength:** [rating]

## ✅ 2. Key Strengths
(List 3–5 specific strengths)

## ⚠️ 3. Major Issues (High Priority)
(Clear, critical problems with explanation + fix)

## ✏️ 4. Minor Issues (Improvements)
(Smaller corrections and suggestions)

## 🔬 5. Methodology Review
### Strengths
### Weaknesses
### Recommendations

## ✍️ 6. Writing & Presentation Feedback
### Clarity
### Tone
### Structure

## 🔗 7. Consistency Check
Alignment between: Objectives → Methods → Results → Conclusions

## ❓ 8. Simulated Viva Questions
Provide 5–8 probing academic questions

## 🎓 9. Final Recommendation
Choose ONE: **Pass** | **Pass with Minor Revisions** | **Revise and Resubmit** | **Reject**
Provide justification.

RULES:
- Do NOT insult, shame, or dismiss the student
- Balance critique with encouragement
- Always suggest HOW to improve, not just what is wrong
- Do not fabricate references
- Do not claim plagiarism unless clearly evident
- Be specific, never vague`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, text } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const userMessage = `Please review the following thesis titled "${title}":\n\n${text}`;

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
