/**
 * Detect whether text is primarily Chinese by checking for CJK characters.
 * Returns "zh-TW" if > 15% of meaningful characters are CJK, otherwise "en".
 */
export function detectJdLanguage(text: string): "en" | "zh-TW" {
  if (!text) return "en";

  const chars = text.replace(/\s/g, ""); // strip whitespace
  if (chars.length === 0) return "en";

  let cjkCount = 0;
  for (const ch of chars) {
    const code = ch.codePointAt(0)!;
    if (
      (code >= 0x4e00 && code <= 0x9fff) || // CJK Unified
      (code >= 0x3400 && code <= 0x4dbf) || // CJK Ext-A
      (code >= 0xf900 && code <= 0xfaff) || // CJK Compat
      (code >= 0x20000 && code <= 0x2a6df)  // CJK Ext-B
    ) {
      cjkCount++;
    }
  }

  const ratio = cjkCount / chars.length;
  return ratio > 0.15 ? "zh-TW" : "en";
}
