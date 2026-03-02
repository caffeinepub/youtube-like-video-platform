# Specification

## Summary
**Goal:** Add a dedicated Settings page to the Mediatube app that consolidates Language selection, Version info, Admin access, About App details, and Download App link into one place.

**Planned changes:**
- Create `SettingsPage.tsx` with five clearly separated sections: Language, Version, Admin, About App, and Download App.
- Move the existing `LanguageSelector` component into the Settings page Language section and remove it from the top navigation bar.
- Display a read-only "App Version" row in the Version section.
- Show an "Admin Dashboard" navigation link in the Admin section, visible only to users where `useIsCallerAdmin` returns true.
- Display static app info (name, description, link to Copyright Policy) in the About App section, visible to all users.
- Display a "Download Mediatube App" row with Android/iOS icons that navigates to the existing `DownloadAppPage`.
- Register `/settings` route in the router and add a Settings entry (with icon) to the sidebar (`Layout.tsx`) and bottom navigation bar (`BottomNav.tsx`).

**User-visible outcome:** Users can navigate to a Settings page from the sidebar or bottom nav, switch language, view app version, access the Admin Dashboard (if admin), read about the app, and navigate to the Download App page — all from one central location.
