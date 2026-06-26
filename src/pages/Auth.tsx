import { useState } from "react";
import { motion } from "framer-motion";
import { GraduationCap, Mail, Lock, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch, setAuthToken } from "@/lib/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const resp = await apiFetch(isLogin ? "/api/auth/login" : "/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          displayName: isLogin ? undefined : displayName,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Authentication failed");
      }

      const data = await resp.json();
      if (data?.token) {
        setAuthToken(data.token);
        await refreshUser();
      }

      toast.success(isLogin ? "Welcome back!" : "Account created successfully!");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-accent/15 flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-7 h-7 text-accent" />
          </div>
          <h1 className="text-3xl font-display font-semibold text-foreground">
            DakaAI
          </h1>
          <p className="text-muted-foreground font-sans mt-1">
            {isLogin ? "Sign in to access your thesis analysis" : "Create an account to get AI-powered thesis feedback"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border p-6 space-y-4 shadow-sm">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-sm font-sans font-medium text-foreground flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-accent" />
                Display Name
              </label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Dr. Jane Smith"
                className="bg-background font-sans"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-sans font-medium text-foreground flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-accent" />
              Email
            </label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@university.edu"
              className="bg-background font-sans"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-sans font-medium text-foreground flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-accent" />
              Password
            </label>
            <Input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-background font-sans"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isLogin ? "Sign In" : "Create Account"}
          </Button>

          <p className="text-center text-sm text-muted-foreground font-sans">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-accent hover:text-accent/80 underline underline-offset-4 transition-colors"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </form>
      </motion.div>
    </div>
  );
};

export default Auth;
