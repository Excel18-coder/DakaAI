# Fix Google OAuth: "Unsupported provider" Error

## Problem
You're getting error: `"Unsupported provider: provider is not enabled"`

This means Google OAuth is NOT enabled in your Supabase project yet.

---

## Solution: Enable Google OAuth in Supabase

### Step 1: Go to Supabase Dashboard
1. Open https://app.supabase.com
2. Select your project
3. Go to **Authentication** (left sidebar)
4. Click **Providers**

### Step 2: Find Google Provider
You should see a list of OAuth providers. Look for "Google" in the list.

### Step 3: Enable Google
- Click on the **Google** provider
- Toggle it **ON** (if it's currently OFF)

### Step 4: Add Google Credentials

You need a **Google Client ID**. If you already have one, skip to Step 5. Otherwise, create one:

#### Creating Google Client ID:
1. Go to https://console.cloud.google.com
2. Create a new project or select existing
3. Enable **Google+ API**
4. Go to **Credentials**
5. Click **Create Credentials** → **OAuth 2.0 Client ID**
6. Choose **Web application**
7. Add these **Authorized origins**:
   - `http://localhost:5173`
   - `http://localhost:3000`
   - Your production domain
8. Add these **Authorized redirect URIs**:
   - `http://localhost:5173/auth/callback`
   - `http://localhost:3000/auth/callback`
   - `https://YOUR-PROJECT.supabase.co/auth/v1/callback`
   - Your production redirect URI
9. Copy the **Client ID**

### Step 5: Add Client ID to Supabase
1. In Supabase dashboard, on the Google provider settings page
2. Paste your **Client ID** from Google Cloud Console
3. (Optional) Add **Client Secret** if you have it
4. Click **Save**

### Step 6: Verify Settings
- Google provider should show **Enabled** ✓
- Client ID should be displayed
- No error message

---

## Test It

1. Go back to your app: http://localhost:5173
2. Click "Sign In" → "Continue with Google"
3. Should redirect to Google login
4. After signing in, should be redirected back to app
5. Should be logged in!

---

## If Still Not Working

### Troubleshooting:

**"Still getting validation_failed error?"**
- Clear browser cache and cookies
- Log out completely from Google
- Try incognito/private window
- Check console for detailed error message

**"Redirect not working?"**
- Verify redirect URIs match exactly (http://localhost:5173/auth/callback)
- No trailing slashes if not in the original URI
- Check Google Console has the correct URIs

**"Getting CORS error?"**
- Supabase handles CORS automatically
- Make sure origins are added correctly in Google Console

**"Client ID not showing in Supabase?"**
- Refresh the page
- Check network tab for errors
- Try saving again

---

## Quick Checklist

- [ ] Google provider **Enabled** in Supabase
- [ ] Client ID **Added** to Supabase
- [ ] Authorized origins include localhost:5173
- [ ] Authorized redirect URIs include `http://localhost:5173/auth/callback`
- [ ] Browser cache cleared
- [ ] Trying in fresh/incognito window

---

## After Enabling

Once enabled, users can:
1. Click "Continue with Google" on auth page
2. Get redirected to Google login
3. Click "Sign in with Google account"
4. Get redirected back to app
5. Be logged in with auto-created profile

---

## Alternative: Disable Google (Use Email Only)

If you don't want to set up Google OAuth, you can:
1. Remove the "Continue with Google" button from the app
2. Users can still sign up/in with email and password

Just let me know if you want to remove it!
