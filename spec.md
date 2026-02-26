# Specification

## Summary
**Goal:** Redesign Mediatube into a full YouTube-style video platform with polished UI, dark theme, and complete page set.

**Planned changes:**
- Redesign HomePage with sticky top nav (logo, search, auth), horizontal category filter chips, and responsive video grid (1/2/3–4 columns)
- Build YouTube-style watch page with large video player, video info/action buttons, channel info row, and right-column recommended videos sidebar
- Add collapsible left sidebar nav (Home, Shorts, Subscriptions, Playlists, Community, Upload) with icon+label; collapse to icon-only; replace with bottom nav on mobile
- Style Shorts page as full-screen vertical reel feed with autoplay-on-scroll and overlaid Like, Comment, Share, Subscribe controls at `/shorts`
- Apply dark-first theme: `#0f0f0f` background, `#212121` cards/sidebar, white text, red (`#ff0000`) accent for subscribe buttons and active nav indicators
- Add Search Results page at `/search?q=<term>` with query heading, video grid, loading skeletons, and empty state
- Add Channel page at `/channel/:principalId` with banner, avatar, channel info, Subscribe button, and tabs for Videos, Shorts, Playlists, Community
- Verify and extend backend Motoko actor to cover all required data: full video metadata (duration, thumbnail, view count, timestamp), user profile (avatar, channel name, handle, subscriber count), comments, subscriptions, and playlists

**User-visible outcome:** Users get a fully YouTube-like experience: browse a dark-themed video grid home page, watch videos with recommended sidebar, scroll Shorts as full-screen reels, search for videos, view channel pages with tabs, and navigate via a collapsible sidebar or mobile bottom nav.
