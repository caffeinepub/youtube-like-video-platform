# Specification

## Summary
**Goal:** Integrate the camera recording flow directly into the UploadVideoPage so users can record, preview, and upload a Short in one continuous flow without leaving the page.

**Planned changes:**
- Add a "Record & Upload Short" button on the UploadVideoPage that opens the existing CameraRecordingModal.
- After the user confirms a recording in the modal, automatically populate the upload form with the recorded Blob as the selected video file.
- Automatically enable the "Mark as Short" toggle when a recording is confirmed via the camera flow.
- Validate the recorded clip duration client-side; if it exceeds 60 seconds, show a warning and uncheck the Short toggle.
- Keep title and description fields editable so the user can complete and submit the form without re-selecting a file.
- If the user cancels the modal, leave the upload form state unchanged.

**User-visible outcome:** Users can record a video clip directly on the UploadVideoPage, have it auto-populated as a Short in the upload form, and submit — all without navigating away from the page.
