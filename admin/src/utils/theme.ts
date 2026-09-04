const SHADE_KEYS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;
type ShadeKey = (typeof SHADE_KEYS)[number];
type Rgb = [number, number, number];

// Lightness gets interpolated toward white/black as a fraction of the
// *remaining* range above/below the input color's own lightness (not a
// fixed target), so the ramp stays correctly ordered — lighter shades
// lighter than 500, darker shades darker — for any input color, including
// ones that are already very light or very dark.
const LIGHTER_FACTORS: Partial<Record<ShadeKey, number>> = { 50: 0.94, 100: 0.85, 200: 0.72, 300: 0.55, 400: 0.32 };
const DARKER_FACTORS: Partial<Record<ShadeKey, number>> = { 600: 0.1, 700: 0.25, 800: 0.34, 900: 0.42 };

const STORAGE_KEY = "vja-brand-color";

function hexToRgb(hex: string): Rgb {
  const clean = hex.replace("#", "");
  return [parseInt(clean.slice(0, 2), 16), parseInt(clean.slice(2, 4), 16), parseInt(clean.slice(4, 6), 16)];
}

function rgbToHsl([r, g, b]: Rgb): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
}

function hslToRgb(h: number, s: number, l: number): Rgb {
  h /= 360;
  s /= 100;
  l /= 100;
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue2rgb = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [Math.round(hue2rgb(h + 1 / 3) * 255), Math.round(hue2rgb(h) * 255), Math.round(hue2rgb(h - 1 / 3) * 255)];
}

// Generates a full 50-900 shade ramp from a single hex color, anchored so
// shade 500 is exactly the input color.
export function generateShades(hex: string): Record<ShadeKey, Rgb> {
  const [h, s, l0] = rgbToHsl(hexToRgb(hex));
  const shades = {} as Record<ShadeKey, Rgb>;
  for (const key of SHADE_KEYS) {
    let l = l0;
    if (key in LIGHTER_FACTORS) l = l0 + (100 - l0) * LIGHTER_FACTORS[key]!;
    else if (key in DARKER_FACTORS) l = l0 - l0 * DARKER_FACTORS[key]!;
    shades[key] = hslToRgb(h, s, l);
  }
  return shades;
}

// Applies a brand color across the whole admin portal by setting the CSS
// custom properties tailwind.config.js's `brand.*` colors read from — so a
// picked color takes effect instantly, for every `bg-brand-*` / `text-brand-*`
// class already in use, with no rebuild.
export function applyBrandColor(hex: string): void {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return;
  const shades = generateShades(hex);
  const root = document.documentElement;
  for (const [key, [r, g, b]] of Object.entries(shades)) {
    root.style.setProperty(`--brand-${key}`, `${r} ${g} ${b}`);
  }
  try {
    localStorage.setItem(STORAGE_KEY, hex);
  } catch {
    // Private browsing / storage disabled — falls back to the default
    // palette next load instead of persisting a per-browser preview.
  }
}

// Paints the last-applied brand color immediately on boot, before the
// settings API call resolves, to avoid a flash of the default blue.
export function applyStoredBrandColor(): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) applyBrandColor(stored);
  } catch {
    // ignore
  }
}
