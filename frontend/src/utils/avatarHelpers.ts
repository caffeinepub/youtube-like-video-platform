/**
 * Convert a Uint8Array image blob to a data URL for rendering.
 */
export function convertBlobToDataURL(blob: Uint8Array): string {
  const binary = Array.from(blob)
    .map((b) => String.fromCharCode(b))
    .join('');
  const base64 = btoa(binary);
  // Detect image type from magic bytes
  let mimeType = 'image/jpeg';
  if (blob[0] === 0x89 && blob[1] === 0x50) mimeType = 'image/png';
  else if (blob[0] === 0x47 && blob[1] === 0x49) mimeType = 'image/gif';
  else if (blob[0] === 0x52 && blob[1] === 0x49) mimeType = 'image/webp';
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Generate initials from a user's display name.
 */
export function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
