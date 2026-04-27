# ⚠️ CRITICAL: Firebase Authorization Fix

**Status:** Popup closes immediately = Firebase is rejecting your domain

## 🔧 IMMEDIATE FIX (5 minutes)

### Step 1: Stop Dev Server
Press `Ctrl+C` in terminal

### Step 2: Update Vite Config
Already done ✓ (Changed from IPv6 to 127.0.0.1)

### Step 3: Configure Firebase Authorized Domains

**IMPORTANT:** Add BOTH of these:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select **kabataai** project
3. **Authentication** → **Settings** (⚙️ gear icon)
4. Scroll to **Authorized domains**
5. Click **Add domain**
6. Enter: `localhost:8080`
7. Click **Add**
8. Click **Add domain** again
9. Enter: `127.0.0.1:8080`
10. Click **Add**

You should now see **BOTH**:
```
✓ localhost:8080
✓ 127.0.0.1:8080
```

11. **Click Save** (if there's a save button)

### Step 4: Clear Browser Cache

1. Press `F12` → **Application** tab
2. **Storage** → **Local Storage** → Click `http://localhost:8080`
3. Click **Clear All** button
4. Close all tabs with your app
5. Close browser completely
6. Reopen browser

### Step 5: Start Dev Server Again

```bash
npm run dev
```

Should show:
```
➜  Local:   http://127.0.0.1:8080/
```

### Step 6: Test

1. Go to **http://127.0.0.1:8080** (or http://localhost:8080)
2. Open DevTools: `F12`
3. Go to **Console** tab
4. Click "Continue with Google"
5. Look at console logs - you should see:
   - 🔓 `Starting Google Sign-In...`
   - 📍 `Current URL: http://127.0.0.1:8080/` or `http://localhost:8080/`

---

## ✅ What Should Happen

After fix:
1. Click "Continue with Google"
2. ✅ Google popup **STAYS OPEN** (doesn't close)
3. You see Google login screen
4. Sign in with your Google account
5. Redirected back to app
6. You're logged in! 🎉

---

## 🐛 If Still Not Working

### Check Console Logs

When you click "Continue with Google", you should see:

```
🔓 Starting Google Sign-In...
📍 Current URL: http://127.0.0.1:8080/
📍 Origin: http://127.0.0.1:8080
🔐 Firebase Auth object: Auth {...}
```

**If you see:** `⚠️ Popup was closed by user or Firebase rejected the domain`

**Then:** `localhost:8080` is still not in Firebase authorized domains

### Verify Firebase Has Both Domains

1. Firebase Console → Authentication → Settings
2. Look at **Authorized domains** section
3. You MUST see:
   - ✓ `localhost:8080`
   - ✓ `127.0.0.1:8080`
   - ✓ `kabataai.firebaseapp.com`

If missing → Add them!

---

## 📋 Complete Checklist

- [ ] Stopped dev server (Ctrl+C)
- [ ] Vite config changed to `127.0.0.1` ✓ (already done)
- [ ] Added `localhost:8080` to Firebase authorized domains
- [ ] Added `127.0.0.1:8080` to Firebase authorized domains  
- [ ] Clicked **Save** in Firebase Console
- [ ] Cleared browser cache completely
- [ ] Restarted browser
- [ ] Run `npm run dev` again
- [ ] Went to http://127.0.0.1:8080 or http://localhost:8080
- [ ] Opened DevTools (F12) → Console tab
- [ ] Clicked "Continue with Google"

---

## 🎯 Key Points

| Issue | Solution |
|-------|----------|
| Popup closes immediately | Domain not in Firebase authorized domains |
| Can't see Firebase config | Check `.env` has all 6 values |
| Still not working after adding domain | Clear browser cache + restart browser |
| Getting network errors | Check internet connection |

---

## 💡 Remember

Firebase popup will **NEVER** work unless the exact domain (including port) is in authorized domains.

- Your app: `http://localhost:8080`
- Firebase authorized domain: Must include `localhost:8080`

Simple as that!
