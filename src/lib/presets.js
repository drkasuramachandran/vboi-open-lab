// Instrument presets — one-click reference builds that populate My Instrument.
// Each preset lists snapshots to append (moduleId + payload) and selected modules
// for the System Builder.

export const PRESETS = [
  {
    id: 'fluorescence-confocal',
    name: 'Fluorescence Confocal',
    icon: 'Microscope',
    accent: 'primary',
    description: 'A high-NA confocal fluorescence microscope for thin cellular sections at 488 nm.',
    selected: ['fundamentals', 'microscope', 'image-processing', 'lens-ray-tracing'],
    snapshots: [
      {
        moduleId: 'fundamentals',
        moduleName: 'Fundamentals',
        payload: {
          summary: 'λ 488 nm · μₐ 0.10 · μₛ\' 8.00 · depth 0.12 mm',
          params: { wavelength: 488, muA: 0.10, muS: 8.0 },
          metrics: { penetrationDepth_mm: 0.123 },
        },
      },
      {
        moduleId: 'lens-ray-tracing',
        moduleName: 'Lens & Ray Tracing',
        payload: {
          summary: 'f=4 mm · Ø=6 mm · f/0.7 · RMS spot=0.008 mm',
          params: { focal: 4, aperture: 6, radius: 8, kSA: 0.0005, kC: 0, kAST: 0 },
          metrics: { fNumber: 0.67, rmsSpot_mm: 0.008 },
        },
      },
      {
        moduleId: 'microscope',
        moduleName: 'Microscope & Confocal',
        payload: {
          summary: 'Confocal · NA=1.30 · pinhole=1.0 AU',
          params: { mode: 'confocal', na: 1.3, pinhole: 1.0 },
        },
      },
      {
        moduleId: 'image-processing',
        moduleName: 'Image Processing',
        payload: {
          summary: 'grayscale · sample',
          params: { filter: 'gray', threshold: 128, source: 'sample' },
        },
      },
    ],
  },
  {
    id: 'handheld-raman',
    name: 'Handheld Raman',
    icon: 'Zap',
    accent: 'amber',
    description: 'Fiber-coupled 785 nm Raman probe for point spectroscopy on tissue.',
    selected: ['fiber-optic', 'beam-propagation', 'raman'],
    snapshots: [
      {
        moduleId: 'beam-propagation',
        moduleName: 'Beam Propagation',
        payload: {
          summary: 'w₀=40 µm · λ=785 nm · z_R=6.40 mm',
          params: { w0: 40, lambda: 785, gallery: [] },
          metrics: { rayleighRange_mm: 6.4 },
        },
      },
      {
        moduleId: 'fiber-optic',
        moduleName: 'Fiber Optic Probe',
        payload: {
          summary: 'NA=0.22 · core=200 µm · spot=0.65 mm',
          params: { na: 0.22, core: 200, wd: 5 },
          metrics: { acceptanceDeg: 12.71, spot_um: 650 },
        },
      },
      {
        moduleId: 'raman',
        moduleName: 'Raman Analyzer',
        payload: {
          summary: 'sample · 4 peaks · λ=1e5 p=0.010 · Voigt-fit',
          params: { source: 'sample', baselineOn: true, logLam: 5, pAsym: 0.01, fitted: true },
          metrics: {
            peakCount: 4,
            peaks: [620, 1004, 1450, 1650],
            fwhm: [16, 12, 14, 16],
          },
        },
      },
    ],
  },
  {
    id: 'portable-oct',
    name: 'Portable OCT',
    icon: 'Layers',
    accent: 'primary',
    description: 'Spectral-domain OCT at 1310 nm for cross-sectional retinal or skin imaging.',
    selected: ['fundamentals', 'beam-propagation', 'oct', 'image-processing'],
    snapshots: [
      {
        moduleId: 'fundamentals',
        moduleName: 'Fundamentals',
        payload: {
          summary: 'λ 1310 nm · μₐ 0.05 · μₛ\' 3.00 · depth 0.33 mm',
          params: { wavelength: 1310, muA: 0.05, muS: 3.0 },
          metrics: { penetrationDepth_mm: 0.328 },
        },
      },
      {
        moduleId: 'beam-propagation',
        moduleName: 'Beam Propagation',
        payload: {
          summary: 'w₀=30 µm · λ=1310 nm · z_R=2.16 mm',
          params: { w0: 30, lambda: 1310, gallery: [] },
          metrics: { rayleighRange_mm: 2.16 },
        },
      },
      {
        moduleId: 'oct',
        moduleName: 'OCT Viewer',
        payload: {
          summary: 'A-scan pts=400 · sample · peak z=95',
          params: { source: 'sample', hasMatrix: false, matrixShape: null },
          metrics: { peakDepth: 95, mean: 0.108 },
        },
      },
      {
        moduleId: 'image-processing',
        moduleName: 'Image Processing',
        payload: {
          summary: 'edge · sample',
          params: { filter: 'edge', threshold: 128, source: 'sample' },
        },
      },
    ],
  },
];

export const PRESET_MAP = Object.fromEntries(PRESETS.map((p) => [p.id, p]));
