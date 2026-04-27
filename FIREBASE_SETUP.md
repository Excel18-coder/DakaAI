# Firebase Setup Guide - Google Sign-In

Firebase has been integrated into your app! Now you can sign in with Google without needing Supabase OAuth.

## ✅ What's Already Done

- Firebase package installed
- Firebase config files created
- Auth component updated to use Firebase for Google sign-in
- useAuth hook updated to support both Firebase and email/password auth
- Environment variables added to `.env`

## 🚀 Setup Steps (5 minutes)

### Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or select existing project
3. Enable Google Analytics (optional)
4. Click "Create project"

### Step 2: Set Up Google Sign-In

1. In Firebase Console, go to **Authentication** (left sidebar)
2. Click **Get started**
3. Select **Google** provider
4. Toggle **Enable**
5. Select a **Project support email** (will be shown to users)
6. Click **Save**

### Step 3: Get Your Firebase Config

1. In Firebase Console, click the gear icon ⚙️ → **Project settings**
2. Scroll down to "Your apps"
3. Click the web icon `</>` (or create app if needed)
4. Copy all the configuration values

### Step 4: Add Config to `.env`

In `/home/crash/Desktop/kabataAI/scholar/.env`, fill in these values:

```
VITE_FIREBASE_API_KEY="YOUR_API_KEY"
VITE_FIREBASE_AUTH_DOMAIN="YOUR_PROJECT.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
VITE_FIREBASE_STORAGE_BUCKET="YOUR_PROJECT.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="YOUR_SENDER_ID"
VITE_FIREBASE_APP_ID="YOUR_APP_ID"
```

**Example:**
```
VITE_FIREBASE_API_KEY="AIzaSyDxxx..."
VITE_FIREBASE_AUTH_DOMAIN="scholar-review.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="scholar-review-12345"
VITE_FIREBASE_STORAGE_BUCKET="scholar-review-12345.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789012"
VITE_FIREBASE_APP_ID="1:123456789012:web:abcdef123456"
```

### Step 5: Test It!

1. Start your dev server: `npm run dev`
2. Go to http://localhost:5173
3. Click "Sign in" → "Continue with Google"
4. You should see the Google login popup
5. After signing in, you'll be logged in!

---

## 🎯 How It Works

### Email/Password (Supabase)
- User enters email and password
- Supabase handles authentication
- Works as before ✓

### Google Sign-In (Firebase)
- User clicks "Continue with Google"
- Firebase popup opens
- After Google login, Firebase auth state updates
- App recognizes user is logged in
- Seamless experience!

---

## 📱 Multiple Sign-In Methods

Users can now:
- **Create account** with email/password (Supabase)
- **Sign in** with email/password (Supabase)
- **Sign in** with Google (Firebase)

The app automatically detects which auth method was used.

---

## 🐛 Troubleshooting

### "Google button doesn't work"
- Check that Firebase config is in `.env` (all 6 values filled in)
- Check console for errors (F12 → Console tab)
- Try incognito window (clears browser cache)

### "Blank popup appears then closes"
- Firebase config values may be wrong
- Check all values match your Firebase project settings
- Refresh the page and try again

### "Still showing Supabase OAuth error"
- Don't worry, that's from old code
- Google button now uses Firebase instead
- Email/password still uses Supabase (unchanged)

### "Users stay signed out"
- Check `.env` values are correct
- Restart dev server after updating `.env`
- Check browser localStorage isn't being cleared

---

## ✨ What Didn't Break

✅ Email/password sign up still works
✅ Email/password sign in still works  
✅ Profile settings still work
✅ All API calls still work
✅ Database access unchanged
✅ Review functionality unchanged

Only the Google sign-in changed from Supabase OAuth → Firebase.

---

## 📖 Next Steps

If you want to:
- **Add more providers** (GitHub, Facebook, etc.): They're easy to add in Firebase
- **Store Google profile data**: The app can auto-create profiles from Google info
- **Remove Supabase auth eventually**: You can migrate email/password to Firebase too later

---

## Need Help?

Check your Firebase Console → Authentication → Google provider settings to verify:
- ✓ Google provider is **Enabled**
- ✓ All config values are correct in `.env`

Then test by clicking "Continue with Google" on the sign-in page.
