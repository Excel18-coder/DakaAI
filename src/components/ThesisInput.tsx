import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface ThesisInputProps {
  onSubmit: (title: string, text: string) => void;
  isLoading: boolean;
}

const ThesisInput = ({ onSubmit, isLoading }: ThesisInputProps) => {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmit(title.trim() || "Untitled Thesis", text.trim());
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="space-y-6"
    >
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-display font-semibold text-foreground">
          Submit Your Thesis for Review
        </h2>
        <p className="text-muted-foreground font-sans max-w-xl mx-auto leading-relaxed">
          Paste your thesis or dissertation text below. Our AI examiner will produce a
          structured, comprehensive evaluation with actionable feedback.
        </p>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 space-y-4 shadow-sm">
        <div className="space-y-2">
          <label className="text-sm font-sans font-medium text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent" />
            Thesis Title
          </label>
          <Input
            placeholder="e.g., Machine Learning Applications in Climate Modeling"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="font-sans bg-background"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-sans font-medium text-foreground">
            Thesis Text
          </label>
          <Textarea
            placeholder="Paste your thesis content here... (Introduction, Literature Review, Methodology, Results, Discussion, Conclusion)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[300px] font-sans text-sm leading-relaxed bg-background resize-y"
          />
          <p className="text-xs text-muted-foreground font-sans">
            {text.length.toLocaleString()} characters · ~{Math.ceil(text.split(/\s+/).filter(Boolean).length)} words
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            onClick={handleSubmit}
            disabled={!text.trim() || isLoading}
            className="gap-2 px-6 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Reviewing...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Start Review
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ThesisInput;
