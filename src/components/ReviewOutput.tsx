import { useRef } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ReviewOutputProps {
  content: string;
  title: string;
  isStreaming: boolean;
}

const ReviewOutput = ({ content, title, isStreaming }: ReviewOutputProps) => {
  const reportRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!reportRef.current) return;
    toast.info("Generating PDF...");

    const html2pdf = (await import("html2pdf.js")).default;

    const opt = {
      margin: [0.5, 0.6, 0.5, 0.6],
      filename: `${title.replace(/[^a-zA-Z0-9]/g, "_")}_Review.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    };

    try {
      await html2pdf().set(opt).from(reportRef.current).save();
      toast.success("PDF downloaded!");
    } catch {
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="border-b border-border pb-4 flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-accent font-sans font-semibold mb-1">
            Academic Review Report
          </p>
          <h2 className="text-2xl font-display font-semibold text-foreground">
            {title}
          </h2>
          {isStreaming && (
            <p className="text-sm text-muted-foreground font-sans mt-1 animate-pulse">
              ● Generating review...
            </p>
          )}
        </div>
        {!isStreaming && content && (
          <Button
            onClick={handleDownload}
            variant="outline"
            size="sm"
            className="gap-2 shrink-0"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
        )}
      </div>

      <div className="bg-card rounded-xl border border-border p-6 md:p-8 shadow-sm" ref={reportRef}>
        <div className="prose prose-sm max-w-none font-sans text-foreground
          prose-headings:font-display prose-headings:text-foreground prose-headings:font-semibold
          prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3 prose-h2:border-b prose-h2:border-border prose-h2:pb-2
          prose-h3:text-lg prose-h3:mt-5 prose-h3:mb-2
          prose-h4:text-base prose-h4:mt-4 prose-h4:mb-1 prose-h4:font-semibold
          prose-p:leading-relaxed prose-p:text-foreground/85
          prose-li:text-foreground/85 prose-li:leading-relaxed prose-li:my-1
          prose-strong:text-foreground prose-strong:font-semibold
          prose-em:text-muted-foreground
          prose-blockquote:border-l-accent prose-blockquote:text-muted-foreground prose-blockquote:italic
          prose-hr:border-border prose-hr:my-6
          prose-table:w-full prose-table:border-collapse prose-table:my-4
          prose-th:bg-muted prose-th:text-foreground prose-th:font-semibold prose-th:text-left prose-th:p-3 prose-th:border prose-th:border-border
          prose-td:align-top prose-td:p-3 prose-td:border prose-td:border-border prose-td:text-foreground/90
        ">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{content}</ReactMarkdown>
        </div>
      </div>
    </motion.div>
  );
};

export default ReviewOutput;
