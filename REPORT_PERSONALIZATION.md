# Report Association with Individual Information

## Overview
Reports are now tied to individual users and include their personal information in the generated PDFs. Each review report displays the reviewer's information along with the thesis being reviewed.

## Changes Made

### 1. Database Schema Updates
**File:** `supabase/migrations/20260327113902_358ade68-7193-4cdd-b9c4-611fe8d9d156.sql`

The `profiles` table has been extended with new fields:
- `email`: User's email address
- `author_name`: Name as it appears in reports
- `institution`: User's institution or organization

These fields are automatically populated when a new user signs up and can be updated by the user anytime.

### 2. Type Definitions
**File:** `src/integrations/supabase/types.ts`

Updated the `profiles` table type definitions to include the new fields for TypeScript support.

### 3. Review Output Component
**File:** `src/components/ReviewOutput.tsx`

The `ReviewOutput` component now:
- Accepts optional `userInfo` prop containing author name, email, and institution
- Displays user information in the report header (visible in PDF)
- Shows the review generation date
- Maintains a professional layout with grid formatting for user details

### 4. Main Page Updates
**File:** `src/pages/Index.tsx`

- Added `useEffect` hook to fetch user profile information when component loads
- Passes `userProfile` to the `ReviewOutput` component
- User information is displayed in all generated reports

### 5. Profile Settings Component
**File:** `src/components/ProfileSettings.tsx` (NEW)

A new component for users to manage their profile information:
- Edit author name, email, and institution
- Save changes to the database
- Validation and error handling
- Can be integrated into a settings page

## How It Works

1. **User Signs In**: When a user authenticates, their profile is automatically created with their email and display name.

2. **Update Profile**: Users can use the `ProfileSettings` component to update their author name and institution.

3. **Generate Report**: When generating a review:
   - The system fetches the user's profile information
   - The profile info is passed to the review report component
   - The user's information is displayed in the report header and included in PDF exports

4. **PDF Export**: When downloading a PDF, the report includes:
   - Report title
   - Author name
   - Email address
   - Institution
   - Generation date
   - Full review content

## Integration

To add the profile settings to your application:

```tsx
import ProfileSettings from "@/components/ProfileSettings";

// In your settings page:
<ProfileSettings />
```

## Database Queries

The system uses:
- `SELECT` from profiles table to fetch user information
- `UPDATE` on profiles table to save changes

All operations are protected by Row Level Security (RLS) policies ensuring users can only access their own information.

## Benefits

✓ Reports are clearly attributed to individuals
✓ Institutional affiliation is captured
✓ Professional PDF exports with complete metadata
✓ Users maintain their own information
✓ Easy to implement audit trails and track reviewer contributions
