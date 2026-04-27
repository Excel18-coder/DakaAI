# CRITICAL FIX: Your App Runs on Port 8080, Not 5173

## The Problem

Your dev server runs on **http://localhost:8080** (not 5173), but Firebase is configured for 5173.

## The Solution (2 steps)

### Step 1: Update Firebase Authorized Domains

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select **kabataai** project
3. Go to **Authentication** → **Settings** (gear icon)
4. Scroll to **Authorized domains**
5. Look for `localhost:5173` - **DELETE IT** (it's wrong)
6. Click **Add domain**
7. Enter: `localhost:8080`
8. Click **Add**
9. You should now see: `✓ localhost:8080`
10. **Save** changes

### Step 2: Restart & Test

1. Restart your browser
2. Go to **http://localhost:8080** (not 5173)
3. Click "Sign in" → "Continue with Google"
4. Google popup should appear (not close)
5. After Google login, you should be logged in! ✅

---

## Summary

| Before | After |
|--------|-------|
| ❌ http://localhost:5173 | ✅ http://localhost:8080 |

That's it! This is the fix.
