# Authentication Setup Checklist

## Quick Start

### For Local Development

- [ ] **Email/Password Auth** - Works out of the box with Supabase
  - Try signing up at `/auth`
  - Check terminal for email confirmation details (Supabase local dev mode)
  - Sign in after confirming

- [ ] **Google OAuth** (Optional, requires setup)
  1. Create Google OAuth credentials in Google Cloud Console
  2. Configure callback URIs for localhost
  3. Add credentials to Supabase
  4. Test Google sign-in

### For Production

- [ ] Create Google OAuth credentials for production domain
- [ ] Update Supabase OAuth provider settings
- [ ] Configure email settings (SendGrid, AWS SES, or other)
- [ ] Test entire auth flow on staging
- [ ] Update callback URLs in Google Console
- [ ] Monitor auth logs for issues

## Implementation Details

### Sign Up Flow
```
1. User clicks "Sign up" on Auth page
2. Fills in display name, email, password
3. Clicks "Create Account"
4. Confirmation email sent
5. User clicks link in email
6. Profile auto-created
7. Can now sign in
```

### Login Flow
```
1. User clicks "Sign In"
2. Enters email and password
3. Clicks "Sign In"
4. Redirected to home page
5. Reports show user information
```

### Google OAuth Flow
```
1. User clicks "Continue with Google"
2. Redirected to Google login
3. Google redirects back with auth code
4. Profile auto-created with Google info
5. Logged in and redirected home
```

## Files Modified

- `src/pages/Auth.tsx` - Added Google OAuth button and handler
- `src/hooks/useAuth.tsx` - Already has signOut() method
- `src/integrations/supabase/client.ts` - Already configured
- Created: `AUTHENTICATION.md` - Full setup guide

## Environment Variables

Required in `.env.local`:
```
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_key
```

Optional:
- `VITE_GOOGLE_CLIENT_ID` - For extra security (Supabase handles this)

## Testing Checklist

- [ ] Email sign up works
- [ ] Email sign in works  
- [ ] Email verification email received
- [ ] User stays logged in after refresh
- [ ] Profile updates reflected in reports
- [ ] Sign out clears session
- [ ] Google OAuth configured (optional)
- [ ] Google sign up creates profile
- [ ] Google sign in redirects to home

## Common Issues & Solutions

**"Google sign in not working"**
- ✓ Check Supabase OAuth provider enabled
- ✓ Verify Client ID in Supabase
- ✓ Check redirect URIs configured
- ✓ Check browser console for errors

**"User not staying logged in"**
- ✓ Check localStorage enabled
- ✓ Verify Supabase URL correct
- ✓ Check auth.persistSession = true

**"Email verification not sent"**
- ✓ Check Supabase email settings
- ✓ Verify custom email configured (if needed)
- ✓ Check spam folder

## Next Steps

1. Test the auth flow locally
2. If using Google OAuth:
   - Create Google Cloud project
   - Set up OAuth credentials
   - Configure in Supabase
3. Deploy and test on staging
4. Monitor production auth logs
