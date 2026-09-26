// Deterministic sample datasets used when the user hasn't uploaded anything.
// Real data (Python/RayOptics/MEEP/Tidy3D/OCTproZ) can be uploaded later.

// --- Raman: synthesized spectrum with a slow baseline drift + a few peaks. ---
export const buildRamanSample = () => {
  const points = [];
  const peaks = [
    { c: 620, a: 0.6, w: 18 },
    { c: 1004, a: 1.0, w: 12 },  // phenylalanine
    { c: 1250, a: 0.45, w: 22 }, // amide III
    { c: 1450, a: 0.55, w: 16 }, // CH2 bend
    { c: 1650, a: 0.75, w: 18 }, // amide I
  ];
  for (let x = 400; x <= 1800; x += 4) {
    const baseline = 0.05 + 0.00035 * (x - 400) + 0.15 * Math.exp(-Math.pow((x - 1100) / 500, 2));
    let peakSum = 0;
    peaks.forEach((p) => {
      peakSum += p.a * Math.exp(-Math.pow((x - p.c) / p.w, 2));
    });
    const noise = (Math.sin(x * 0.13) + Math.cos(x * 0.31)) * 0.012;
    points.push({
      shift: x,
      raw: +(baseline + peakSum + noise).toFixed(4),
      baseline: +baseline.toFixed(4),
    });
  }
  return { points, peaks: peaks.map((p) => p.c) };
};

// --- OCT: fake A-scan array + a synthetic B-scan drawn onto a canvas dataURL later. ---
export const buildOctSample = () => {
  const aScan = [];
  const layers = [
    { z: 40, a: 0.9, w: 6 },
    { z: 95, a: 0.7, w: 10 },
    { z: 170, a: 0.5, w: 14 },
    { z: 260, a: 0.3, w: 22 },
  ];
  for (let z = 0; z < 400; z += 1) {
    let val = 0.02 + 0.06 * Math.exp(-z / 220);
    layers.forEach((l) => { val += l.a * Math.exp(-Math.pow((z - l.z) / l.w, 2)); });
    val += (Math.sin(z * 0.7) + Math.cos(z * 1.13)) * 0.01;
    aScan.push({ depth: z, intensity: +val.toFixed(4) });
  }
  return { aScan, layers: layers.map((l) => l.z) };
};

// --- Sample raster image (biomedical-looking) drawn on canvas & exported as dataURL ---
export const buildSampleImageDataUrl = (w = 320, h = 240) => {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  // Background gradient
  const g = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w);
  g.addColorStop(0, '#0e5560'); g.addColorStop(1, '#02202a');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  // Fake cells
  for (let i = 0; i < 40; i++) {
    const cx = Math.random() * w;
    const cy = Math.random() * h;
    const r = 6 + Math.random() * 14;
    const rg = ctx.createRadialGradient(cx, cy, 1, cx, cy, r);
    rg.addColorStop(0, 'rgba(245, 200, 90, 0.9)');
    rg.addColorStop(1, 'rgba(245, 200, 90, 0)');
    ctx.fillStyle = rg;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  }
  // Grid overlay
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  for (let i = 0; i < w; i += 20) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke(); }
  for (let j = 0; j < h; j += 20) { ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(w, j); ctx.stroke(); }
  return canvas.toDataURL('image/png');
};

// --- Sample "OCT B-scan" like image (layered tissue) ---
export const buildSampleOctBscanDataUrl = (w = 480, h = 260) => {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#020a10'; ctx.fillRect(0, 0, w, h);
  const layerYs = [40, 78, 120, 175, 220];
  layerYs.forEach((ly, idx) => {
    for (let x = 0; x < w; x++) {
      const y = ly + Math.sin(x * 0.05 + idx) * 5 + Math.sin(x * 0.02) * 3;
      const alpha = 0.9 - idx * 0.12;
      const grad = ctx.createLinearGradient(0, y - 6, 0, y + 6);
      grad.addColorStop(0, `rgba(240,210,120,0)`);
      grad.addColorStop(0.5, `rgba(255,220,140,${alpha})`);
      grad.addColorStop(1, `rgba(240,210,120,0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(x, y - 6, 1, 12);
    }
  });
  // Speckle
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.random() - 0.5) * 40;
    data[i] = Math.min(255, Math.max(0, data[i] + n));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n));
  }
  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL('image/png');
};
