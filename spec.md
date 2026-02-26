# Specification

## Summary
**Goal:** Enhance the search results page with richer video cards and add voice search capability to the navigation search bar.

**Planned changes:**
- Update the SearchResultsPage to display video cards showing thumbnail, title, channel name, view count, upload date, and duration for each result
- Add a results count label at the top of the results list (e.g., '12 results for "cats"')
- Preserve loading skeleton states and show an empty state when no results are found
- Add a microphone icon button to the search bar in the navigation header
- Implement voice search using the browser's Web Speech API (SpeechRecognition) that transcribes spoken input and automatically triggers a search
- Show a visual indicator (pulsing/animated mic) while voice recognition is active
- Gracefully hide or disable the mic button if the browser does not support SpeechRecognition
- Show a brief toast notification on recognition errors (e.g., no speech detected)

**User-visible outcome:** Users can see richer search result cards with video details and a results count, and can initiate searches by speaking into the microphone button in the navigation bar.
