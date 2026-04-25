import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const ProfileSettings = () => {
  const { user } = useAuth();
  const [authorName, setAuthorName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("author_name, email")
          .eq("id", user.id)
          .single();

        if (!error && data) {
          setAuthorName(data.author_name || "");
          setEmail(data.email || "");
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setIsFetching(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          author_name: authorName || null,
          email: email || null,
        })
        .eq("id", user.id);

      if (error) {
        toast.error("Failed to save profile. Please try again.");
        console.error("Save error:", error);
      } else {
        toast.success("Profile updated successfully!");
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      toast.error("An error occurred while saving.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return <div className="text-sm text-muted-foreground">Loading profile...</div>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Author Name
        </label>
        <Input
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          placeholder="Your name as it appears in reports"
          className="font-sans"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Email
        </label>
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          type="email"
          className="font-sans"
        />
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? "Saving..." : "Save Profile"}
      </Button>
    </form>
  );
};

export default ProfileSettings;
