# Authentication Setup Guide

## Overview
ScholarReview AI now has complete authentication with email/password signup and login, plus Google OAuth integration.

## Features Implemented

### 1. Email/Password Authentication
- **Sign Up**: Users create an account with email, password, and display name
- **Sign In**: Users login with email and password
- **Email Verification**: Confirmation email is sent to verify the account
- **Auto-profile Creation**: Profile is automatically created on signup with display name

### 2. Google OAuth
- **One-Click Sign In**: Users can sign in with their Google account
- **One-Click Sign Up**: New users can create accounts using Google
- **Automatic Profile**: Profile is created with Google account information

## Setting Up Google OAuth

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Choose "Web application"
6. Add authorized origins:
   - `http://localhost:5173` (for local development)
   - `http://localhost:3000` (alternative dev port)
   - Your production domain (e.g., `https://scholarreview.ai`)
7. Add authorized redirect URIs:
   - `http://localhost:5173/auth/callback` (local)
   - `https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback` (Supabase)
   - Your production callback URL

8. Copy the **Client ID**

### Step 2: Configure Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Navigate to: **Authentication** → **Providers**
3. Find and enable **Google**
4. Paste your **Client ID** from Google Cloud Console
5. (Optional) Add a **Client Secret** if you have one
6. Save the configuration

### Step 3: Set Environment Variables

In your `.env.local` file:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

## Authentication Flow

### Email/Password Flow
```
1. User fills email/password form
2. handleSubmit() called
3. supabase.auth.signUp() or signInWithPassword()
4. Profile auto-created on signup
5. User redirected to home page
```

### Google OAuth Flow
```
1. User clicks "Continue with Google"
2. handleGoogleSignIn() called
3. supabase.auth.signInWithOAuth({ provider: "google" })
4. User redirected to Google login
5. Google redirects back to app with auth code
6. Profile auto-created with Google info
7. User logged in and redirected to home
```

## Auth Endpoints

- **Sign Up**: `POST /auth/v1/signup` → Email verification required
- **Sign In**: `POST /auth/v1/token` → Direct login
- **Google OAuth**: `POST /auth/v1/authorize?provider=google` → External redirect

## User Profile Management

After authentication, users can:
1. Edit their profile via `ProfileSettings` component
2. Update author name and email
3. This information appears in their review reports

## Session Management

- Sessions are persisted in `localStorage`
- Auto-refresh token handles session renewal
- Users remain logged in after browser refresh
- Sign out clears session and profile data

## Pages and Components

### Auth Page (`src/pages/Auth.tsx`)
- Handles both sign up and sign in
- Google OAuth button integrated
- Form validation and error handling
- Toggle between login and signup modes

### useAuth Hook (`src/hooks/useAuth.tsx`)
- Provides user and session state globally
- Used throughout app to check authentication
- Exposes `signOut()` function

### ProfileSettings Component (`src/components/ProfileSettings.tsx`)
- Allows users to manage their profile
- Update author name and email
- Changes reflected in future reports

## Database Tables

### profiles
```sql
- id (UUID): User ID from auth.users
- display_name (TEXT): Display name
- author_name (TEXT): Name for reports
- email (TEXT): User email
- created_at (TIMESTAMPTZ): Account creation date
```

Row Level Security (RLS) ensures users can only access their own profile.

## Error Handling

The auth flow includes error handling for:
- Invalid credentials
- Network errors
- Google OAuth failures
- Email verification timeouts

All errors are displayed to users via toast notifications.

## Testing Authentication

### Local Testing
1. Sign up with a test email
2. Check spam folder for verification email
3. Click verification link
4. Try Google sign in (requires Google Cloud setup)

### Production Deployment
1. Update callback URLs in Google Console
2. Update Supabase OAuth settings for production domain
3. Test with real Google account
4. Monitor for auth-related errors

## Security Considerations

✅ Passwords encrypted by Supabase
✅ Secure OAuth 2.0 flow
✅ PKCE protection for mobile
✅ Session tokens auto-refresh
✅ RLS protects user data
✅ CORS configured properly

## Troubleshooting

### Google Sign In Not Working
- Check Client ID is correct
- Verify redirect URIs match
- Check Google OAuth provider is enabled in Supabase
- Look at browser console for errors

### Email Verification Not Sending
- Check Supabase email settings
- Verify email domain is configured
- Check spam folder

### User Not Staying Logged In
- Check localStorage is enabled
- Verify VITE_SUPABASE_URL is correct
- Check auth persistence settings
