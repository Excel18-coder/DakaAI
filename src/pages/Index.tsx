import { useState, useCallback } from "react";
import Header from "@/components/Header";
import ThesisInput from "@/components/ThesisInput";
import ReviewOutput from "@/components/ReviewOutput";
import ScoreSheetButton from "@/components/ScoreSheetButton";
import AiDetectionResult, { type AiDetectionData } from "@/components/AiDetectionResult";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const Index = () => {
  const { user } = useAuth();
  const [reviewContent, setReviewContent] = useState("");
  const [thesisTitle, setThesisTitle] = useState("");
  const [thesisText, setThesisText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [saved, setSaved] = useState(false);
  const [aiDetection, setAiDetection] = useState<AiDetectionData | null>(null);

  const saveReview = useCallback(async (title: string, text: string, content: string) => {
    if (!user) return;
    const { error } = await supabase.from("reviews").insert({
      user_id: user.id,
      thesis_title: title,
      thesis_text: text,
      review_content: content,
    });
    if (error) {
      console.error("Save error:", error);
    } else {
      setSaved(true);
    }
  }, [user]);

  const handleSubmit = useCallback(async (title: string, text: string, format: string) => {
    if (!SUPABASE_URL) {
      toast.error("Backend not configured. Please enable Lovable Cloud.");
      return;
    }

    setThesisTitle(title);
    setThesisText(text);
    setReviewContent("");
    setShowReview(true);
    setIsLoading(true);
    setSaved(false);

    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/review-thesis`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ title, text, format }),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) {
          toast.error("Rate limit reached. Please wait a moment and try again.");
        } else if (resp.status === 402) {
          toast.error("AI credits exhausted. Please add funds in Settings → Workspace → Usage.");
        } else {
          toast.error("Failed to start review. Please try again.");
        }
        setIsLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullContent += content;
              setReviewContent(fullContent);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // Flush remaining
      if (buffer.trim()) {
        for (let raw of buffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullContent += content;
              setReviewContent(fullContent);
            }
          } catch { /* ignore */ }
        }
      }

      setIsLoading(false);
      toast.success("Review complete!");

      // Auto-save if logged in
      if (user && fullContent) {
        await saveReview(title, text, fullContent);
      }
    } catch (err) {
      console.error("Review error:", err);
      toast.error("An error occurred during review. Please try again.");
      setIsLoading(false);
    }
  }, [user, saveReview]);

  const handleScore = useCallback(async (title: string, text: string, format: string) => {
    if (!SUPABASE_URL) {
      toast.error("Backend not configured.");
      return;
    }
    setIsLoading(true);
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/score-thesis`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ title, text, format }),
      });
      if (!resp.ok) {
        toast.error("Failed to generate score. Please try again.");
        return;
      }
      const data = await resp.json();
      toast.success(`Score: ${data.totalScore}/100 — ${data.recommendation}`);

      // Generate PDF
      const { generateAndDownloadScorePDF } = await import("@/components/ScoreSheetButton");
      await generateAndDownloadScorePDF(title, data);
    } catch (err) {
      console.error("Score error:", err);
      toast.error("An error occurred while scoring.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDetectAi = useCallback(async (title: string, text: string) => {
    if (!SUPABASE_URL) {
      toast.error("Backend not configured.");
      return;
    }
    setIsLoading(true);
    setAiDetection(null);
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/detect-ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ title, text }),
      });
      if (!resp.ok) {
        toast.error("Failed to run AI detection. Please try again.");
        return;
      }
      const data = await resp.json();
      setAiDetection(data);
      toast.success(`AI Detection: ${data.verdict} (${data.overallAiScore}%)`);
    } catch (err) {
      console.error("AI detection error:", err);
      toast.error("An error occurred during AI detection.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleNewReview = () => {
    setShowReview(false);
    setReviewContent("");
    setThesisTitle("");
    setThesisText("");
    setSaved(false);
    setAiDetection(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto px-6 py-10">
        {!showReview ? (
          <ThesisInput onSubmit={handleSubmit} onScore={handleScore} onDetectAi={handleDetectAi} isLoading={isLoading} />
        ) : (
          <div className="space-y-6">
            <ReviewOutput
              content={reviewContent}
              title={thesisTitle}
              isStreaming={isLoading}
            />
            {!isLoading && reviewContent && (
              <div className="flex flex-col items-center gap-3 pt-4">
                <ScoreSheetButton title={thesisTitle} text={thesisText} format="" />
                {user && saved && (
                  <p className="text-xs text-success font-sans">✓ Saved to your review history</p>
                )}
                {!user && (
                  <p className="text-xs text-muted-foreground font-sans">
                    <a href="/auth" className="text-accent underline underline-offset-4">Sign in</a> to save reviews for later
                  </p>
                )}
                <button
                  onClick={handleNewReview}
                  className="text-sm font-sans text-accent hover:text-accent/80 underline underline-offset-4 transition-colors"
                >
                  ← Submit another thesis for review
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
