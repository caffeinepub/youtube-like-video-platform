# Specification

## Summary
**Goal:** Add Google/Gmail Sign-In and Sign-Up support to the Mediatube app using the existing Google Identity Services integration.

**Planned changes:**
- Add a "Continue with Google" button on the Login page that triggers Google Identity Services sign-in; on success, redirect to home if a profile exists, or open ProfileSetupModal pre-filled with Google account data if not
- Add a "Join with Google" button on the Signup page that triggers Google sign-in for new users and opens ProfileSetupModal pre-filled with Google name and avatar
- Update ProfileSetupModal to accept optional `googleDisplayName` and `googleAvatarUrl` props for pre-filling the channel name and avatar preview
- Update the Layout/navbar to display the Google user's profile picture and display name as a circular avatar when signed in via Google, with navigation to the Profile page and a sign-out option; show the sign-in button when no session is active

**User-visible outcome:** Users can sign in or sign up using their Google/Gmail account. The navbar reflects the Google profile picture and name, and new users are guided through profile setup with their Google data pre-filled.
