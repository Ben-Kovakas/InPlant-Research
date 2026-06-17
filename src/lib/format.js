/* Number / unit formatting helpers — shared across all views so units are
   consistent (HANDSHAKE §1: units in the name, bands not false precision). */

export const fmtInt = (n) =>
  n == null ? "—" : Math.round(n).toLocaleString("en-US");

export const fmtUsd = (n) =>
  n == null ? "—" : "$" + Math.round(n).toLocaleString("en-US");

/** Compact USD: $1.2M / $498K. */
export function fmtUsdCompact(n) {
  if (n == null) return "—";
  const a = Math.abs(n);
  if (a >= 1e6) return "$" + (n / 1e6).toFixed(a >= 1e7 ? 0 : 1) + "M";
  if (a >= 1e3) return "$" + Math.round(n / 1e3) + "K";
  return "$" + Math.round(n);
}

/** Band like "$2.8M–$5.7M" or "2.5–8 yr". */
export function fmtRange(range, unit = "", { usd = false } = {}) {
  if (!range || range.low == null) return "—";
  const f = usd ? fmtUsdCompact : (x) => round1(x).toLocaleString("en-US");
  const lo = f(range.low);
  const hi = f(range.high);
  const sep = lo === hi ? "" : "–" + hi;
  return `${lo}${sep}${unit ? " " + unit : ""}`;
}

export const fmtMw = (kw) => (kw == null ? "—" : (kw / 1000).toFixed(2) + " MW");
export const fmtGwh = (kwh) => (kwh == null ? "—" : (kwh / 1e6).toFixed(2) + " GWh");
export const fmtGal = (g) => {
  if (g == null) return "—";
  if (g >= 1e6) return (g / 1e6).toFixed(1) + "M gal";
  if (g >= 1e3) return Math.round(g / 1e3) + "K gal";
  return Math.round(g) + " gal";
};
export const fmtTons = (t) => (t == null ? "—" : fmtInt(t) + " t");
export const fmtPct = (n) => (n == null ? "—" : Math.round(n) + "%");

export const round1 = (n) => Math.round(n * 10) / 10;
