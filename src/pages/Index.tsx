import { useState, useCallback, useEffect } from "react";
import Header from "@/components/Header";
import ThesisInput from "@/components/ThesisInput";
import ReviewOutput from "@/components/ReviewOutput";
import ScoreSheetButton from "@/components/ScoreSheetButton";
import AiDetectionResult, { type AiDetectionData } from "@/components/AiDetectionResult";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { apiFetch, API_BASE_URL } from "@/lib/api";

interface UserProfile {
  authorName?: string | null;
  email?: string | null;
}

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reviewContent, setReviewContent] = useState("");
  const [thesisTitle, setThesisTitle] = useState("");
  const [thesisText, setThesisText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [saved, setSaved] = useState(false);
  const [aiDetection, setAiDetection] = useState<AiDetectionData | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      return;
    }
    setUserProfile({
      authorName: "displayName" in user ? user.displayName || null : null,
      email: "email" in user ? user.email || null : null,
    });
  }, [user]);

  const saveReview = useCallback(async (title: string, text: string, content: string) => {
    if (!user) return;
    try {
      const resp = await apiFetch("/api/reports", {
        method: "POST",
        body: JSON.stringify({
          thesisTitle: title,
          thesisText: text,
          reviewContent: content,
          reportType: "review",
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        console.error("Save error:", err);
      } else {
        setSaved(true);
      }
    } catch (error) {
      console.error("Save error:", error);
    }
  }, [user]);

  const handleSubmit = useCallback(async (title: string, text: string, format: string) => {
    setThesisTitle(title);
    setThesisText(text);
    setReviewContent("");
    setShowReview(true);
    setIsLoading(true);
    setSaved(false);

    try {
      const resp = await fetch(`${API_BASE_URL}/api/review-thesis`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
    setIsLoading(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/score-thesis`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
    setIsLoading(true);
    setAiDetection(null);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/detect-ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
        {!user && !showReview && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 rounded-xl border border-border bg-card p-8 text-center shadow-sm"
          >
            <h2 className="text-2xl font-display font-semibold text-foreground mb-2">
              Welcome to ScholarReview AI
            </h2>
            <p className="text-muted-foreground font-sans mb-6 max-w-2xl mx-auto">
              Get comprehensive, AI-powered feedback on your academic thesis. Our system analyzes your work and provides structured, actionable insights to help improve your writing.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Button
                onClick={() => navigate("/auth")}
                className="font-sans bg-accent text-accent-foreground hover:bg-accent/90"
              >
                Sign Up for Free
              </Button>
              <Button
                onClick={() => navigate("/auth")}
                variant="outline"
                className="font-sans"
              >
                Sign In
              </Button>
            </div>
            <p className="text-xs text-muted-foreground font-sans mt-4">
              Create an account to save your reviews and track your progress.
            </p>
          </motion.div>
        )}
        {!showReview ? (
          <div className="space-y-6">
            <ThesisInput onSubmit={handleSubmit} onScore={handleScore} onDetectAi={handleDetectAi} isLoading={isLoading} />
            {aiDetection && (
              <AiDetectionResult data={aiDetection} onClose={() => setAiDetection(null)} />
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <ReviewOutput
              content={reviewContent}
              title={thesisTitle}
              isStreaming={isLoading}
              userInfo={userProfile}
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
