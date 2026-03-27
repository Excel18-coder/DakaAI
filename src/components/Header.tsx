import { motion } from "framer-motion";
import { BookOpen, GraduationCap, LogOut, History } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";

const Header = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50"
    >
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/15 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-display font-semibold text-foreground leading-tight">
              ScholarReview
            </h1>
            <p className="text-xs text-muted-foreground font-sans tracking-wide uppercase">
              AI Thesis Examiner
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link to="/history">
                <Button
                  variant={location.pathname === "/history" ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-1.5 font-sans"
                >
                  <History className="w-4 h-4" />
                  <span className="hidden sm:inline">My Reviews</span>
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="gap-1.5 font-sans text-muted-foreground"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <BookOpen className="w-4 h-4" />
              <span className="text-sm font-sans">Academic Review Assistant</span>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
