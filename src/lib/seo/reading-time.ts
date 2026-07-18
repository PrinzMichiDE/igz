export function estimateReadingTimeMinutes(text: string, wpm = 220) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / wpm));
}
