# Quick Reference: Sign Up/Login UI

## Where Users Can Sign Up/Login

### 🔴 RED: Highly Visible - Every Page
**Header Buttons (Top Right)**
- NOT logged in: `[Sign In]` `[Sign Up]`
- Logged in: `[My Reviews]` `[Sign Out]`

### 🟡 ORANGE: Very Visible - Home Page
**Welcome Banner (Below Header)**
- Shows when: NOT logged in + on home page
- Content: "Welcome to ScholarReview AI" + two buttons
- Buttons: `[Sign Up for Free]` `[Sign In]`

### 🟢 GREEN: Available - After Review
**Inline Link (Below Generated Review)**
- Shows when: Generated review + NOT logged in
- Text: "Sign in to save reviews for later"

---

## User Flow Shortcuts

### "I want to sign up" → 3 options:
1. Click `[Sign Up]` in header
2. Click `[Sign Up for Free]` in welcome banner
3. Go to `/auth` directly

### "I want to sign in" → 3 options:
1. Click `[Sign In]` in header
2. Click `[Sign In]` in welcome banner
3. Go to `/auth` directly

### "I want to use Google" → Go to `/auth`
- Click `[Continue with Google]` button

---

## Visual Reference

### Home Page (Not Logged In)
```
┌────────────────────────────────┐
│ Logo  ScholarReview  [In] [Up] │ ← Header
├────────────────────────────────┤
│ Welcome Banner                 │ ← Shows here
│ [Sign Up for Free] [Sign In]   │
│                                │
│ Thesis Input Form (hidden)     │
└────────────────────────────────┘
```

### Home Page (Logged In)
```
┌────────────────────────────────┐
│ Logo  ScholarReview [Rev] [Out]│ ← Header
├────────────────────────────────┤
│ Thesis Input Form              │ ← Visible now
│ (Welcome banner hidden)        │
└────────────────────────────────┘
```

---

## Files Changed

- `src/components/Header.tsx` - Auth buttons
- `src/pages/Index.tsx` - Welcome banner

Both files error-free ✅

---

## Testing

Open app → Should see:
- ✓ "Sign In" button in header
- ✓ "Sign Up" button in header
- ✓ Welcome banner on home page

Click "Sign Up" or "Sign In" → Should go to `/auth` page

---

## Done! 🎉

Users can now easily sign up and login from multiple convenient locations.
