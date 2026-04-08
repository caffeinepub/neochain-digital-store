/**
 * Region detection utility — India & Nepal only.
 * Uses timezone + browser language as signals (client-side best-effort).
 */

const ALLOWED_TIMEZONES = ["Asia/Kolkata", "Asia/Kathmandu"];
const ALLOWED_LANGUAGES = ["en-IN", "ne-NP", "ne", "hi", "hi-IN"];

export function isAllowedRegion(): boolean {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (ALLOWED_TIMEZONES.includes(tz)) return true;

    // Fallback: check navigator languages
    const langs = navigator.languages ?? [navigator.language];
    return langs.some((l) =>
      ALLOWED_LANGUAGES.some((a) =>
        l.toLowerCase().startsWith(a.toLowerCase()),
      ),
    );
  } catch {
    // If detection fails, allow (fail-open — blocking by mistake is worse)
    return true;
  }
}

export function getRegionCurrency(): "INR" | "NPR" | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz === "Asia/Kathmandu") return "NPR";
    if (tz === "Asia/Kolkata") return "INR";

    const langs = navigator.languages ?? [navigator.language];
    if (langs.some((l) => l.toLowerCase().startsWith("ne"))) return "NPR";
    if (langs.some((l) => l.toLowerCase().startsWith("hi"))) return "INR";
    if (langs.some((l) => l.toLowerCase() === "en-in")) return "INR";
  } catch {
    // ignore
  }
  return null;
}

export function getCurrencySymbol(currency: "INR" | "NPR" | null): string {
  if (currency === "NPR") return "NPR ";
  return "₹";
}
