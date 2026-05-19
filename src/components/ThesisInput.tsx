import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { FileText, Send, Loader2, Upload, X, File, ClipboardCheck, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/api";

type CitationFormat = "APA" | "MLA" | "Chicago" | "IEEE";

interface ThesisInputProps {
  onSubmit: (title: string, text: string, format: CitationFormat) => void;
  onScore: (title: string, text: string, format: CitationFormat) => void;
  onDetectAi: (title: string, text: string) => void;
  isLoading: boolean;
}

const ThesisInput = ({ onSubmit, onScore, onDetectAi, isLoading }: ThesisInputProps) => {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [format, setFormat] = useState<CitationFormat>("APA");
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [".txt", ".pdf", ".docx", ".md"];
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (!validTypes.includes(ext)) {
      toast.error("Please upload a .txt, .pdf, or .docx file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 10MB.");
      return;
    }

    setUploadedFile(file);
    setIsParsing(true);

    try {
      if (ext === ".txt" || ext === ".md") {
        const content = await file.text();
        setText(content);
        if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));
      } else {
        const formData = new FormData();
        formData.append("file", file);

        const resp = await fetch(`${API_BASE_URL}/api/parse-document`, {
          method: "POST",
          headers: {
          },
          body: formData,
        });

        const data = await resp.json();
        if (!resp.ok) {
          toast.error(data.error || "Failed to parse document.");
          setUploadedFile(null);
          return;
        }

        setText(data.text);
        if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));
        toast.success("Document text extracted successfully!");
      }
    } catch (err) {
      console.error("File parse error:", err);
      toast.error("Failed to parse file. Please paste the text manually.");
      setUploadedFile(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setText("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmit(title.trim() || "Untitled Thesis", text.trim(), format);
  };

  const handleScore = () => {
    if (!text.trim()) return;
    onScore(title.trim() || "Untitled Thesis", text.trim(), format);
  };

  const handleDetectAi = () => {
    if (!text.trim()) return;
    onDetectAi(title.trim() || "Untitled Thesis", text.trim());
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
          Upload your thesis document or paste the text below. Our AI examiner will produce a
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

        {/* Citation Format */}
        <div className="space-y-2">
          <label className="text-sm font-sans font-medium text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent" />
            Citation Format
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(["APA", "MLA", "Chicago", "IEEE"] as CitationFormat[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                className={`px-3 py-2 rounded-lg border text-sm font-sans font-medium transition-colors ${
                  format === f
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:border-primary/50"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* File Upload Area */}
        <div className="space-y-2">
          <label className="text-sm font-sans font-medium text-foreground flex items-center gap-2">
            <Upload className="w-4 h-4 text-accent" />
            Upload Document
          </label>

          {!uploadedFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-accent/50 hover:bg-accent/5 transition-colors"
            >
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-sans text-muted-foreground">
                Click to upload or drag & drop
              </p>
              <p className="text-xs text-muted-foreground/70 font-sans mt-1">
                Supports PDF, DOCX, TXT (max 10MB)
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-3 border border-border rounded-lg p-3 bg-background">
              <File className="w-5 h-5 text-accent flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-sans text-foreground truncate">{uploadedFile.name}</p>
                <p className="text-xs text-muted-foreground font-sans">
                  {(uploadedFile.size / 1024).toFixed(1)} KB
                  {isParsing && " · Extracting text..."}
                </p>
              </div>
              {isParsing ? (
                <Loader2 className="w-4 h-4 animate-spin text-accent" />
              ) : (
                <button onClick={handleRemoveFile} className="text-muted-foreground hover:text-destructive transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.pdf,.docx,.md"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        <div className="relative">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center">
            <div className="flex-1 border-t border-border" />
            <span className="px-3 text-xs text-muted-foreground font-sans bg-card">or paste text directly</span>
            <div className="flex-1 border-t border-border" />
          </div>
          <div className="h-6" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-sans font-medium text-foreground">
            Thesis Text
          </label>
          <Textarea
            placeholder="Paste your thesis content here... (Introduction, Literature Review, Methodology, Results, Discussion, Conclusion)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[250px] font-sans text-sm leading-relaxed bg-background resize-y"
          />
          <p className="text-xs text-muted-foreground font-sans">
            {text.length.toLocaleString()} characters · ~{Math.ceil(text.split(/\s+/).filter(Boolean).length)} words
          </p>
        </div>

        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <Button
            onClick={handleDetectAi}
            disabled={!text.trim() || isLoading || isParsing}
            variant="outline"
            className="gap-2 px-6"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4" />
                AI Detection
              </>
            )}
          </Button>
          <Button
            onClick={handleScore}
            disabled={!text.trim() || isLoading || isParsing}
            variant="outline"
            className="gap-2 px-6"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ClipboardCheck className="w-4 h-4" />
                Score Report (PDF)
              </>
            )}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!text.trim() || isLoading || isParsing}
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
