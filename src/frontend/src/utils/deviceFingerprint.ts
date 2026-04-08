/**
 * Device fingerprint utility.
 * Generates a stable hash from User-Agent, screen resolution, timezone, and canvas fingerprint.
 */

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "no-canvas";
    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("NeoChain🔒", 2, 15);
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.fillText("NeoChain🔒", 4, 17);
    return canvas.toDataURL().slice(-50);
  } catch {
    return "canvas-blocked";
  }
}

let _cached: string | null = null;

export async function getDeviceFingerprint(): Promise<string> {
  if (_cached) return _cached;

  const parts = [
    navigator.userAgent,
    `${screen.width}x${screen.height}x${screen.colorDepth}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.language,
    String(navigator.hardwareConcurrency ?? "?"),
    getCanvasFingerprint(),
  ];

  const raw = parts.join("|");
  _cached = await sha256(raw);
  return _cached;
}

/** Synchronous fast fingerprint (less precise, no canvas) */
export function getDeviceFingerprintSync(): string {
  const parts = [
    navigator.userAgent,
    `${screen.width}x${screen.height}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.language,
  ];
  // Simple djb2-style hash
  let hash = 5381;
  const str = parts.join("|");
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}
