/* v4.10 KEALEE's own flat icons first (assets/icons · drawn for the game · tools/art/flat/icons.py) · the designer liked the flat emoji look → drawn in that style (same on every phone) · emo('🏃') → <img> · anything not drawn stays as text */
export const OWN = new Set(['1f3f9']);   /* v4.14 the designer: back to the system emoji · only the bow uses our drawing (like the sample) */
const key = s => [...s].map(c => c.codePointAt(0)).filter(c => c !== 0xfe0f).map(c => c.toString(16)).join('_');
export function emo(s) { if (!s) return ''; const k = key(s); if (OWN.has(k)) return `<img class="emo" src="assets/icons/${k}.svg" alt="${s}" draggable="false">`; return s }
