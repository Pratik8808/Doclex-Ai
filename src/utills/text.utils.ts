export function isTextValid(text: string): boolean {
  if (!text) return false;

  const trimmed = text.trim();

  // Minimum meaningful length
  if (trimmed.length < 100) return false;

  // Reject garbage (too many symbols vs letters)
  const alphaCount = (trimmed.match(/[a-zA-Z]/g) || []).length;
  const ratio = alphaCount / trimmed.length;

  return ratio > 0.3; // at least 30% readable text
}

export function cleanText(text: string): string {
  if (!text) return "";

  return text
    .replace(/\r\n/g, "\n")        // normalize line breaks
    .replace(/\n{2,}/g, "\n\n")    // reduce multiple newlines
    .replace(/[ \t]+/g, " ")       // collapse spaces
    .replace(/[^\x00-\x7F]/g, "")  // remove weird unicode (optional)
    .trim();
}