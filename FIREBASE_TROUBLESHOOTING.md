# Firebase Sign-In Troubleshooting

If you're getting "Sign in cancelled" error, follow these steps:

## 🔧 Fix 1: Add Localhost to Firebase Authorized Origins (Most Common)

This is the #1 reason Firebase popup closes immediately.

### Steps:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project **"kabataai"**
3. Go to **Authentication** → **Settings** (gear icon)
4. Scroll down to **Authorized domains**
5. Click **Add domain**
6. Enter: `localhost:5173`
7. Click **Add**

You should now see:
```
✓ localhost:5173
✓ kabataai.firebaseapp.com
```

8. **Save and refresh** your app

---

## 🔧 Fix 2: Clear Browser Cache & Cookies

Sometimes old Firebase config is cached:

1. Open Dev Tools: Press `F12`
2. Go to **Application** tab
3. **Storage** → **Local Storage** → Delete `localhost:5173`
4. **Cookies** → Delete all localhost cookies
5. **Refresh** the page (Ctrl+F5 or Cmd+Shift+R)
6. Try Google sign-in again

---

## 🔧 Fix 3: Use Incognito/Private Window

Test in a fresh browser session:

1. Open **Incognito** (Ctrl+Shift+N) or **Private** window (Cmd+Shift+N)
2. Go to http://localhost:5173
3. Try Google sign-in

If it works in incognito, the issue is browser cache → do Fix 2

---

## 🔧 Fix 4: Check Console Errors

See what Firebase is actually saying:

1. Open your app: http://localhost:5173
2. Press `F12` → **Console** tab
3. Click "Continue with Google"
4. Look for red error messages
5. Share any errors you see

---

## ✅ After Fixes

Once you add `localhost:5173` to Firebase authorized domains:

1. Restart dev server: `npm run dev`
2. Clear browser cache (Fix 2)
3. Try sign-in again
4. Google popup should appear (not close immediately)
5. After Google login, you should be signed in!

---

## 🎯 Quick Checklist

- [ ] Added `localhost:5173` to Firebase authorized domains
- [ ] Cleared browser cache
- [ ] Restarted dev server
- [ ] Tried in incognito window
- [ ] Checked console for errors

---

## Still Not Working?

Check that your `.env` has all Firebase values filled in. Run this in terminal:

```bash
grep VITE_FIREBASE /home/crash/Desktop/kabataAI/scholar/.env
```

Should show:
```
VITE_FIREBASE_API_KEY=AIzaSyAMYLdejVAlUkWZzavNDTAn6u4n9tUo4oY
VITE_FIREBASE_AUTH_DOMAIN=kabataai.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=kabataai
VITE_FIREBASE_STORAGE_BUCKET=kabataai.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=754451045627
VITE_FIREBASE_APP_ID=1:754451045627:web:a9414c9e6a2e738e3be45e
```

If any are empty, Google sign-in won't work.
