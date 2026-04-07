import { motion } from "framer-motion";
import { ShieldAlert, ShieldCheck, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface Signal {
  score: number;
  evidence: string;
}

interface FlaggedPassage {
  text: string;
  reason: string;
}

export interface AiDetectionData {
  overallAiScore: number;
  humanScore: number;
  confidence: string;
  verdict: string;
  signals: Record<string, Signal>;
  flaggedPassages: FlaggedPassage[];
  summary: string;
}

interface Props {
  data: AiDetectionData;
  onClose: () => void;
}

const signalLabels: Record<string, string> = {
  repetitivePatterns: "Repetitive Patterns",
  vocabularyUniformity: "Vocabulary Uniformity",
  hedgingOveruse: "Hedging Overuse",
  lackOfPersonalVoice: "Lack of Personal Voice",
  structurePredictability: "Structure Predictability",
  burstiness: "Burstiness (low = AI-like)",
  perplexity: "Perplexity (low = AI-like)",
  clicheDensity: "Cliché Density",
  citationAuthenticity: "Citation Authenticity",
  depthVsBreadth: "Depth vs Breadth",
};

function getVerdictColor(score: number) {
  if (score <= 25) return "text-green-600";
  if (score <= 50) return "text-yellow-600";
  if (score <= 75) return "text-orange-500";
  return "text-red-600";
}

function getVerdictIcon(score: number) {
  if (score <= 25) return <ShieldCheck className="w-8 h-8 text-green-600" />;
  if (score <= 50) return <AlertTriangle className="w-8 h-8 text-yellow-600" />;
  return <ShieldAlert className="w-8 h-8 text-red-600" />;
}

function getBarColor(score: number) {
  if (score <= 25) return "bg-green-500";
  if (score <= 50) return "bg-yellow-500";
  if (score <= 75) return "bg-orange-500";
  return "bg-red-500";
}

const AiDetectionResult = ({ data, onClose }: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border p-6 space-y-6 shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {getVerdictIcon(data.overallAiScore)}
          <div>
            <h3 className="text-lg font-display font-semibold text-foreground">
              AI Content Detection Report
            </h3>
            <p className={`text-sm font-semibold ${getVerdictColor(data.overallAiScore)}`}>
              {data.verdict} · Confidence: {data.confidence}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Score gauge */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-background rounded-lg p-4 border border-border text-center">
          <p className="text-xs text-muted-foreground font-sans mb-1">AI Score</p>
          <p className={`text-3xl font-display font-bold ${getVerdictColor(data.overallAiScore)}`}>
            {data.overallAiScore}%
          </p>
        </div>
        <div className="bg-background rounded-lg p-4 border border-border text-center">
          <p className="text-xs text-muted-foreground font-sans mb-1">Human Score</p>
          <p className="text-3xl font-display font-bold text-green-600">
            {data.humanScore}%
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-background rounded-lg p-4 border border-border">
        <p className="text-sm font-sans text-foreground/85 leading-relaxed">{data.summary}</p>
      </div>

      {/* Signal breakdown */}
      <div className="space-y-3">
        <h4 className="text-sm font-display font-semibold text-foreground">Signal Breakdown</h4>
        {Object.entries(data.signals || {}).map(([key, signal]) => (
          <div key={key} className="space-y-1">
            <div className="flex items-center justify-between text-xs font-sans">
              <span className="text-foreground/80">{signalLabels[key] || key}</span>
              <span className={`font-medium ${getVerdictColor(signal.score)}`}>{signal.score}%</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${getBarColor(signal.score)}`}
                style={{ width: `${signal.score}%` }}
              />
            </div>
            {signal.evidence && (
              <p className="text-xs text-muted-foreground font-sans pl-1">{signal.evidence}</p>
            )}
          </div>
        ))}
      </div>

      {/* Flagged passages */}
      {data.flaggedPassages?.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-display font-semibold text-foreground">
            Flagged Passages ({data.flaggedPassages.length})
          </h4>
          {data.flaggedPassages.map((p, i) => (
            <div key={i} className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg p-3 space-y-1">
              <p className="text-xs font-sans text-foreground/80 italic">"{p.text}"</p>
              <p className="text-xs font-sans text-red-600 dark:text-red-400">{p.reason}</p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default AiDetectionResult;
