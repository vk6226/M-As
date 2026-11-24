/* Point-cloud generators for the hero scene. Every shape returns exactly `n`
   points (x, y, z) so the GPU can morph between them particle-for-particle.
   Units: roughly a 4 x 4 x 4 box centred at the origin, base at y = -1.6. */

export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const gauss = (r: Rng) => {
  let u = 0;
  let v = 0;
  while (u === 0) u = r();
  while (v === 0) v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

/** Shuffle so that any prefix is a uniform sample (lets us drop points on mobile). */
function shuffle(arr: Float32Array, r: Rng) {
  const n = arr.length / 3;
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    for (let k = 0; k < 3; k++) {
      const t = arr[i * 3 + k];
      arr[i * 3 + k] = arr[j * 3 + k];
      arr[j * 3 + k] = t;
    }
  }
  return arr;
}

/* ---------- 1. Global deal flow: a globe with latitude bands and deal arcs ---------- */
export function globe(n: number, seed = 1): Float32Array {
  const r = mulberry32(seed);
  const out = new Float32Array(n * 3);
  const R = 1.45;
  const cy = 0.25;
  const surface = Math.floor(n * 0.62);
  const arcs = Math.floor(n * 0.26);
  let i = 0;
  // Surface, denser on "continents" using a cheap noise mask.
  while (i < surface) {
    const u = r() * 2 - 1;
    const th = r() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    const x = s * Math.cos(th);
    const z = s * Math.sin(th);
    const land = Math.sin(th * 3 + u * 4) * Math.cos(u * 6 - th) + Math.sin(th * 7) * 0.3;
    if (land < 0.15 && r() > 0.22) continue;
    const jitter = 1 + (r() - 0.5) * 0.015;
    out[i * 3] = x * R * jitter;
    out[i * 3 + 1] = u * R * jitter + cy;
    out[i * 3 + 2] = z * R * jitter;
    i++;
  }
  // Great-circle arcs between hubs, lifted off the surface.
  const hubs = Array.from({ length: 14 }, () => {
    const u = r() * 1.4 - 0.7;
    const th = r() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    return [s * Math.cos(th), u, s * Math.sin(th)];
  });
  while (i < surface + arcs) {
    const a = hubs[Math.floor(r() * hubs.length)];
    const b = hubs[Math.floor(r() * hubs.length)];
    if (a === b) continue;
    const t = r();
    let x = a[0] * (1 - t) + b[0] * t;
    let y = a[1] * (1 - t) + b[1] * t;
    let z = a[2] * (1 - t) + b[2] * t;
    const len = Math.hypot(x, y, z) || 1;
    const lift = 1 + Math.sin(Math.PI * t) * 0.32;
    x = (x / len) * R * lift;
    y = (y / len) * R * lift;
    z = (z / len) * R * lift;
    out[i * 3] = x;
    out[i * 3 + 1] = y + cy;
    out[i * 3 + 2] = z;
    i++;
  }
  // Atmosphere halo.
  while (i < n) {
    const u = r() * 2 - 1;
    const th = r() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    const rr = R * (1.08 + Math.abs(gauss(r)) * 0.12);
    out[i * 3] = s * Math.cos(th) * rr;
    out[i * 3 + 1] = u * rr + cy;
    out[i * 3 + 2] = s * Math.sin(th) * rr;
    i++;
  }
  return shuffle(out, r);
}

/* ---------- 2. Market depth: a rising 3D bar chart with a trend ribbon ---------- */
export function marketBars(n: number, seed = 2): Float32Array {
  const r = mulberry32(seed);
  const out = new Float32Array(n * 3);
  const cols = 8;
  const rows = 3;
  const w = 0.3;
  const gap = 0.2;
  const width = cols * (w + gap);
  const depth = rows * (w + gap);
  const base = -1.45;
  const heights: number[] = [];
  for (let c = 0; c < cols; c++)
    for (let d = 0; d < rows; d++) heights.push(0.35 + Math.pow((c + 1) / cols, 1.6) * 2.6 * (0.75 + 0.25 * Math.sin(c * 1.7 + d)) + r() * 0.15);
  const barPts = Math.floor(n * 0.86);
  let i = 0;
  while (i < barPts) {
    const k = Math.floor(r() * heights.length);
    const c = Math.floor(k / rows);
    const d = k % rows;
    const h = heights[k];
    // Weight by bar surface area so tall bars get more points.
    if (r() > h / 3.2 + 0.15) continue;
    const x0 = -width / 2 + c * (w + gap);
    const z0 = -depth / 2 + d * (w + gap);
    const face = r();
    let x: number, y: number, z: number;
    if (face < 0.5) {
      // Vertical edges and top rim read as crisp columns.
      const e = Math.floor(r() * 4);
      const ex = e === 0 || e === 3 ? x0 : x0 + w;
      const ez = e < 2 ? z0 : z0 + w;
      if (r() < 0.7) {
        x = ex + gauss(r) * 0.006;
        y = base + r() * h;
        z = ez + gauss(r) * 0.006;
      } else {
        const t = r() * w;
        const side = Math.floor(r() * 4);
        x = side < 2 ? x0 + t : side === 2 ? x0 : x0 + w;
        z = side < 2 ? (side === 0 ? z0 : z0 + w) : z0 + t;
        y = base + h;
      }
    } else if (face < 0.62) {
      x = x0 + r() * w;
      y = base + h;
      z = z0 + r() * w; // top cap
    } else {
      y = base + Math.pow(r(), 0.7) * h; // faces, denser near the top
      const side = Math.floor(r() * 4);
      const t = r() * w;
      x = side === 0 ? x0 : side === 1 ? x0 + w : x0 + t;
      z = side === 2 ? z0 : side === 3 ? z0 + w : z0 + t;
    }
    out[i * 3] = x;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = z;
    i++;
  }
  // Trend ribbon above the bars.
  while (i < n) {
    const t = r();
    const x = -width / 2 + t * width;
    const y = base + 0.8 + Math.pow(t, 1.5) * 2.35 + Math.sin(t * 14) * 0.08 + gauss(r) * 0.02;
    const z = -depth / 2 - 0.25 + gauss(r) * 0.03;
    out[i * 3] = x;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = z;
    i++;
  }
  return shuffle(out, r);
}

/* ---------- 3. Group structure: a branching tree (holding company -> subsidiaries) ---------- */
export function groupTree(n: number, seed = 3): Float32Array {
  const r = mulberry32(seed);
  type Seg = { a: number[]; b: number[]; w: number };
  const segs: Seg[] = [];
  const tips: number[][] = [];
  const grow = (p: number[], dir: number[], len: number, w: number, depth: number) => {
    const b = [p[0] + dir[0] * len, p[1] + dir[1] * len, p[2] + dir[2] * len];
    segs.push({ a: p, b, w });
    if (depth === 0) {
      tips.push(b);
      return;
    }
    const kids = depth > 3 ? 2 : 3;
    for (let k = 0; k < kids; k++) {
      const ang = (k / kids) * Math.PI * 2 + r() * 1.2;
      const spread = 0.45 + r() * 0.35;
      let d = [dir[0] + Math.cos(ang) * spread, dir[1] * 0.9 + 0.12, dir[2] + Math.sin(ang) * spread];
      const l = Math.hypot(d[0], d[1], d[2]);
      d = d.map((v) => v / l);
      grow(b, d, len * (0.68 + r() * 0.12), w * 0.62, depth - 1);
    }
  };
  grow([0, -1.45, 0], [0.05, 1, 0], 1.05, 0.11, 5);

  const out = new Float32Array(n * 3);
  const trunkPts = Math.floor(n * 0.28);
  const totalLen = segs.reduce((s, g) => s + Math.hypot(g.b[0] - g.a[0], g.b[1] - g.a[1], g.b[2] - g.a[2]) * (g.w * 6 + 0.4), 0);
  let i = 0;
  for (const g of segs) {
    const L = Math.hypot(g.b[0] - g.a[0], g.b[1] - g.a[1], g.b[2] - g.a[2]);
    const count = Math.round((trunkPts * L * (g.w * 6 + 0.4)) / totalLen);
    for (let k = 0; k < count && i < trunkPts; k++, i++) {
      const t = r();
      const ang = r() * Math.PI * 2;
      const rad = g.w * Math.sqrt(r());
      out[i * 3] = g.a[0] + (g.b[0] - g.a[0]) * t + Math.cos(ang) * rad;
      out[i * 3 + 1] = g.a[1] + (g.b[1] - g.a[1]) * t;
      out[i * 3 + 2] = g.a[2] + (g.b[2] - g.a[2]) * t + Math.sin(ang) * rad;
    }
  }
  // Canopy clusters around the tips (the "subsidiaries").
  while (i < n) {
    const tip = tips[Math.floor(r() * tips.length)];
    const s = 0.2 + r() * 0.16;
    out[i * 3] = tip[0] + gauss(r) * s;
    out[i * 3 + 1] = tip[1] + gauss(r) * s * 0.8 + 0.05;
    out[i * 3 + 2] = tip[2] + gauss(r) * s;
    i++;
  }
  // Fit into the frame.
  let maxY = -Infinity;
  for (let k = 0; k < n; k++) maxY = Math.max(maxY, out[k * 3 + 1]);
  const scale = 3.55 / (maxY + 1.45);
  for (let k = 0; k < n; k++) {
    out[k * 3] *= scale;
    out[k * 3 + 1] = (out[k * 3 + 1] + 1.45) * scale - 1.45;
    out[k * 3 + 2] *= scale;
  }
  return shuffle(out, r);
}

/* ---------- Pedestal: a softly lit plinth the object rests on ---------- */
export function pedestal(n: number, seed = 4): Float32Array {
  const r = mulberry32(seed);
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2;
    const top = r() < 0.55;
    const rad = top ? 1.25 * Math.sqrt(r()) : 1.25 + gauss(r) * 0.015;
    out[i * 3] = Math.cos(a) * rad * 1.25;
    out[i * 3 + 1] = top ? -1.5 + gauss(r) * 0.01 : -1.5 - r() * 0.32;
    out[i * 3 + 2] = Math.sin(a) * rad * 0.62;
  }
  return out;
}

export const SHAPES = [
  { id: 'globe', label: 'Global deal flow', build: globe },
  { id: 'bars', label: 'Market depth', build: marketBars },
  { id: 'tree', label: 'Group structure', build: groupTree },
] as const;
