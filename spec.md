# Specification

## Summary
**Goal:** Enhance the Reels and Video experience with smooth scrolling, richer interactions, theatre mode, chapter markers, and a subscribed reels feed.

**Planned changes:**
- Upgrade ReelsPage to support full-screen vertical snap-scrolling with autoplay for the active reel, auto-pause for off-screen reels, and a playback progress bar at the top of each reel card
- Add a "For You" / "Following" tab switcher at the top of the ReelsPage; "Following" tab shows reels from subscribed channels only, with login/subscribe prompts when empty
- Enhance ReelCard action sidebar with animated like button and count, comment count badge that opens a comments drawer, share button with toast confirmation, and a follow/subscribe button on the uploader's avatar
- Add a bottom overlay on ReelCard showing video title and description with a "Show more" toggle for long descriptions
- Add a mute/unmute toggle button with animated icon on ReelCard, persisting mute preference to localStorage
- Enhance VideoPlayerPage with a theatre/cinematic mode toggle that expands the player to full width and collapses the sidebar
- Add chapter markers on the video seek bar parsed from `MM:SS Title` timestamp lines in the video description, with tooltip on hover
- Show an end-screen overlay with recommended video thumbnails when playback finishes, with a 5-second countdown auto-selecting the next video
- Add a `getSubscribedReels` query in the backend actor returning short-form videos (`isShort = true`) from subscribed channels, sorted by upload date descending
- Add a `useGetSubscribedReels` React Query hook that calls `getSubscribedReels`, enabled only when an authenticated identity is present

**User-visible outcome:** Users can swipe through a TikTok-style full-screen reels feed with tabs for "For You" and "Following", enjoy richer reel interactions (likes, comments, share, mute, subscribe), and watch long-form videos in theatre mode with chapter navigation and an end-screen for recommended content.
