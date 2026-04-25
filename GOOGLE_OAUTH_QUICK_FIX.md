# Quick Fix: Disable Google OAuth Temporarily

If you want to get the app working immediately without Google OAuth, follow these steps:

## Option 1: Remove Google Button (Keep Email/Password)

This disables Google OAuth but email/password auth still works.

Replace the Google button section in `src/pages/Auth.tsx`:

```tsx
// REMOVE THIS SECTION:
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground font-sans">or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            disabled={loading}
            onClick={handleGoogleSignIn}
            variant="outline"
            className="w-full gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>
```

Also remove this function:

```tsx
const handleGoogleSignIn = async () => {
  setLoading(true);
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  } catch (err: any) {
    toast.error(err.message || "Google sign in failed");
    setLoading(false);
  }
};
```

---

## Option 2: Keep Google Button But Fix Supabase

If you want to keep Google OAuth but get it working:

### Quick Setup (5 minutes):

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project

2. **Go to Auth → Providers**
   - Click on **Google**
   - Click toggle to **Enable**

3. **Get Google Client ID**
   - Go to https://console.cloud.google.com
   - Create new project or use existing
   - Enable Google+ API
   - Create OAuth 2.0 Client ID
   - Add authorized redirect URI: `https://YOUR-PROJECT.supabase.co/auth/v1/callback`
   - Copy Client ID

4. **Add to Supabase**
   - Paste Client ID in Google provider settings
   - Click Save

5. **Done!** Google OAuth now works

---

## Recommended: Option 1 Now, Option 2 Later

I suggest:
1. **Now**: Remove Google button (Option 1) - app works immediately
2. **Later**: Set up Google OAuth (Option 2) - when you have time

Users can still:
- Sign up with email/password
- Sign in with email/password
- Reports show their information

Would you like me to **remove the Google button** so the app works right now?

Just reply "yes" and I'll do it!
