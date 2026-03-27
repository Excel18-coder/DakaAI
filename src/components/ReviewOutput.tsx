import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Pencil,
  Microscope,
  PenTool,
  Link2,
  HelpCircle,
  Award,
} from "lucide-react";

interface ReviewOutputProps {
  content: string;
  title: string;
  isStreaming: boolean;
}

const sectionIcons: Record<string, React.ReactNode> = {
  "1": <BarChart3 className="w-5 h-5 text-info" />,
  "2": <CheckCircle2 className="w-5 h-5 text-success" />,
  "3": <AlertTriangle className="w-5 h-5 text-destructive" />,
  "4": <Pencil className="w-5 h-5 text-warning" />,
  "5": <Microscope className="w-5 h-5 text-info" />,
  "6": <PenTool className="w-5 h-5 text-accent" />,
  "7": <Link2 className="w-5 h-5 text-muted-foreground" />,
  "8": <HelpCircle className="w-5 h-5 text-info" />,
  "9": <Award className="w-5 h-5 text-accent" />,
};

const ReviewOutput = ({ content, title, isStreaming }: ReviewOutputProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="border-b border-border pb-4">
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

      <div className="bg-card rounded-xl border border-border p-6 md:p-8 shadow-sm">
        <div className="prose prose-sm max-w-none font-sans text-foreground
          prose-headings:font-display prose-headings:text-foreground prose-headings:font-semibold
          prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3 prose-h2:border-b prose-h2:border-border prose-h2:pb-2
          prose-h3:text-lg prose-h3:mt-5 prose-h3:mb-2
          prose-p:leading-relaxed prose-p:text-foreground/85
          prose-li:text-foreground/85 prose-li:leading-relaxed
          prose-strong:text-foreground prose-strong:font-semibold
          prose-em:text-muted-foreground
          prose-blockquote:border-l-accent prose-blockquote:text-muted-foreground prose-blockquote:italic
        ">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </motion.div>
  );
};

export default ReviewOutput;
