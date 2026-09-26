// Optics + spectroscopy math helpers used across VBOI modules.

// ─────────────────────────────────────────────────────────
// ABCD ray-transfer matrices (paraxial, 2×2)
// state: [y, θ]  (height, slope in radians)
// ─────────────────────────────────────────────────────────
export const M_translation = (d) => [[1, d], [0, 1]];
export const M_thinLens   = (f) => [[1, 0], [-1 / f, 1]];

export const matMul = (A, B) => [
  [A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]],
  [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]],
];
export const matApply = (M, r) => [M[0][0] * r[0] + M[0][1] * r[1], M[1][0] * r[0] + M[1][1] * r[1]];

/**
 * Trace a collimated ray at input height y0 through:
 * free space (d1) → thin lens (f) → free space (d2)
 * Optionally add a 3rd-order spherical-aberration transverse deviation
 * at the lens exit: Δθ = -k · y0³ / f²   (k unitless, positive)
 */
export const traceCollimatedRay = (y0, f, d1, d2, kSA = 0) => {
  const start = [y0, 0];
  const afterTravel1 = matApply(M_translation(d1), start);
  let afterLens = matApply(M_thinLens(f), afterTravel1);
  if (kSA !== 0) {
    afterLens = [afterLens[0], afterLens[1] - (kSA * Math.pow(y0, 3)) / (f * f)];
  }
  const atImage = matApply(M_translation(d2), afterLens);
  return { afterTravel1, afterLens, atImage };
};

// ─────────────────────────────────────────────────────────
// Asymmetric Least-Squares (AsLS) baseline correction
// Eilers & Boelens (2005). Solves (W + λ·D'D) z = W y iteratively.
// D is the 2nd-order difference operator, so D'D is pentadiagonal
// with pattern [1, -4, 6, -4, 1] in the interior.
// Weights are updated: w_i = p if y_i > z_i else (1-p).
// ─────────────────────────────────────────────────────────
export const asLsBaseline = (y, lam = 1e5, p = 0.01, niter = 10, gsIter = 40) => {
  const N = y.length;
  if (N < 5) return y.slice();
  const z = y.slice();
  const w = new Float64Array(N).fill(1);

  const dd = (i) => {
    if (i === 0 || i === N - 1) return 1;
    if (i === 1 || i === N - 2) return 5;
    return 6;
  };
  const ddP1 = (i) => (i === 0 || i === N - 2 ? -2 : -4); // (D'D)_{i,i+1}
  const ddM1 = (i) => (i === 1 || i === N - 1 ? -2 : -4); // (D'D)_{i,i-1}

  for (let it = 0; it < niter; it++) {
    // Gauss–Seidel iterations for (W + λ·D'D) z = W y
    for (let gs = 0; gs < gsIter; gs++) {
      for (let i = 0; i < N; i++) {
        let sum = w[i] * y[i];
        if (i - 2 >= 0)      sum -= lam * 1 * z[i - 2];
        if (i - 1 >= 0)      sum -= lam * ddM1(i) * z[i - 1];
        if (i + 1 < N)       sum -= lam * ddP1(i) * z[i + 1];
        if (i + 2 < N)       sum -= lam * 1 * z[i + 2];
        z[i] = sum / (w[i] + lam * dd(i));
      }
    }
    for (let i = 0; i < N; i++) {
      w[i] = y[i] > z[i] ? p : 1 - p;
    }
  }
  return Array.from(z);
};

// ─────────────────────────────────────────────────────────
// Pseudo-Voigt profile:  η · L(x; γ) + (1 − η) · G(x; γ)
// where L(x) = 1 / (1 + (x/γ)²), G(x) = exp(−ln2 · (x/γ)²)
// γ is HWHM for both components (pseudo-Voigt convention).
// ─────────────────────────────────────────────────────────
export const pseudoVoigt = (x, x0, gamma, eta) => {
  const dx = (x - x0) / gamma;
  const lor = 1 / (1 + dx * dx);
  const gau = Math.exp(-Math.LN2 * dx * dx);
  return eta * lor + (1 - eta) * gau;
};

/**
 * Fit a single pseudo-Voigt to a windowed (xs, ys) slice.
 * Grid-search over (x0, γ, η). Amplitude A solved analytically each step:
 *   A = Σ y·v / Σ v·v.
 * Returns { A, x0, gamma, eta, fwhm, rss }.
 */
export const fitPseudoVoigt = (xs, ys, x0Guess, gammaGuess = 10) => {
  let best = { rss: Infinity, A: 0, x0: x0Guess, gamma: gammaGuess, eta: 0.5 };
  const gMin = Math.max(2, gammaGuess * 0.4);
  const gMax = gammaGuess * 2.5;
  for (let x0 = x0Guess - 8; x0 <= x0Guess + 8; x0 += 1) {
    for (let g = gMin; g <= gMax; g += 1) {
      for (let eta = 0; eta <= 1; eta += 0.2) {
        let sumYV = 0, sumVV = 0;
        for (let i = 0; i < xs.length; i++) {
          const v = pseudoVoigt(xs[i], x0, g, eta);
          sumYV += ys[i] * v;
          sumVV += v * v;
        }
        const A = sumVV > 0 ? sumYV / sumVV : 0;
        let rss = 0;
        for (let i = 0; i < xs.length; i++) {
          const v = A * pseudoVoigt(xs[i], x0, g, eta);
          rss += (ys[i] - v) ** 2;
        }
        if (rss < best.rss) best = { rss, A, x0, gamma: g, eta };
      }
    }
  }
  best.fwhm = 2 * best.gamma;
  return best;
};

// ─────────────────────────────────────────────────────────
// Very tolerant CSV parser — returns 2D array of numbers.
// Skips header rows that don't parse as numbers.
// ─────────────────────────────────────────────────────────
export const parseCsvMatrix = (text) => {
  const lines = String(text || '').split(/\r?\n/).filter((l) => l.trim().length > 0);
  const rows = [];
  for (const ln of lines) {
    const parts = ln.split(/[,;\t\s]+/).map((s) => s.trim()).filter(Boolean);
    const nums = parts.map(Number);
    if (nums.length > 0 && nums.every((n) => Number.isFinite(n))) rows.push(nums);
  }
  return rows;
};
