import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Trash2, Eye, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import ReviewOutput from "@/components/ReviewOutput";
import { apiFetch } from "@/lib/api";

interface Review {
  _id: string;
  thesisTitle: string;
  thesisText: string;
  reviewContent: string;
  createdAt: string;
}

const History = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchReviews = async () => {
      try {
        const resp = await apiFetch("/api/reports");
        if (!resp.ok) {
          toast.error("Failed to load reviews");
          return;
        }
        const data = await resp.json();
        setReviews(data || []);
      } catch (error) {
        console.error("Fetch reviews error:", error);
        toast.error("Failed to load reviews");
      }
      setLoading(false);
    };
    fetchReviews();
  }, [user]);

  const handleDelete = async (id: string) => {
    try {
      const resp = await apiFetch(`/api/reports/${id}`, { method: "DELETE" });
      if (!resp.ok) {
        toast.error("Failed to delete review");
        return;
      }
      setReviews((prev) => prev.filter((r) => r._id !== id));
      if (selectedReview?._id === id) setSelectedReview(null);
      toast.success("Review deleted");
    } catch (error) {
      console.error("Delete review error:", error);
      toast.error("Failed to delete review");
    }
  };

  if (selectedReview) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <button
            onClick={() => setSelectedReview(null)}
            className="flex items-center gap-2 text-sm text-accent hover:text-accent/80 font-sans mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to history
          </button>
          <ReviewOutput
            content={selectedReview.reviewContent}
            title={selectedReview.thesisTitle}
            isStreaming={false}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display font-semibold text-foreground">
              Review History
            </h2>
            <p className="text-sm text-muted-foreground font-sans mt-1">
              Your past thesis reviews
            </p>
          </div>
          <Link to="/">
            <Button variant="outline" className="gap-2 font-sans">
              <ArrowLeft className="w-4 h-4" />
              New Review
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-16 text-muted-foreground font-sans">Loading...</div>
        ) : reviews.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 space-y-3"
          >
            <Clock className="w-10 h-10 text-muted-foreground/50 mx-auto" />
            <p className="text-muted-foreground font-sans">No reviews yet. Submit a thesis to get started.</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {reviews.map((review, i) => (
              <motion.div
                key={review._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="font-display font-semibold text-foreground truncate">
                    {review.thesisTitle}
                  </h3>
                  <p className="text-xs text-muted-foreground font-sans mt-0.5">
                    {new Date(review.createdAt).toLocaleDateString("en-US", {
                      year: "numeric", month: "long", day: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedReview(review)}
                    className="gap-1.5 font-sans"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(review._id)}
                    className="text-destructive hover:text-destructive/80"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
