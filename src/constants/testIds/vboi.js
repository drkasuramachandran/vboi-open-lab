// Central catalogue of data-testid values used across VBOI pages.
export const VBOI = {
  // Layout
  sidebar: 'vboi-sidebar',
  sidebarLink: (id) => `sidebar-link-${id}`,
  header: 'vboi-header',
  savedCount: 'vboi-saved-count',
  shareBtn: 'vboi-share-btn',
  shareDialog: 'vboi-share-dialog',
  shareInput: 'vboi-share-input',
  shareCopy: 'vboi-share-copy',
  shareLoadedToast: 'vboi-share-loaded',

  // Home
  heroCta: 'home-hero-cta',
  systemDiagram: 'home-system-diagram',

  // Generic module shell
  moduleTitle: 'module-title',
  moduleExplainer: 'module-explainer',
  saveBtn: 'module-save-btn',
  uploadInput: (id) => `upload-input-${id}`,

  // Fundamentals
  fundWavelength: 'fund-wavelength-slider',
  fundAbsorption: 'fund-absorption-slider',
  fundScattering: 'fund-scattering-slider',
  fundDepthChart: 'fund-depth-chart',

  // Lens
  lensFocalLength: 'lens-focal-length-slider',
  lensAperture: 'lens-aperture-slider',
  lensRadius: 'lens-radius-slider',
  lensSA: 'lens-sa-slider',
  lensComa: 'lens-coma-slider',
  lensAst: 'lens-ast-slider',
  lensRayDiagram: 'lens-ray-diagram',
  lensSpotDiagram: 'lens-spot-diagram',
  lensAbcdMatrix: 'lens-abcd-matrix',

  // Beam
  beamWaist: 'beam-waist-slider',
  beamWavelength: 'beam-wavelength-slider',
  beamProfileChart: 'beam-profile-chart',
  beamGallery: 'beam-gallery',
  beamNpyUpload: 'beam-npy-upload',
  beamNpyMeta: 'beam-npy-meta',

  // Presets (Home)
  presetsSection: 'presets-section',
  presetCard: (id) => `preset-card-${id}`,
  presetLoad: (id) => `preset-load-${id}`,
  presetConfirmDialog: 'preset-confirm-dialog',
  presetConfirmYes: 'preset-confirm-yes',
  presetConfirmCancel: 'preset-confirm-cancel',

  // Share QR
  shareQr: 'vboi-share-qr',

  // Instructor lock
  lockToggle: 'vboi-lock-toggle',
  lockBanner: 'vboi-lock-banner',

  // Results dashboard downloads + beam cross-section
  resultDownload: (id) => `result-download-${id}`,
  beamCrossSection: 'beam-cross-section',
  beamCrossSectionSelect: 'beam-cross-section-select',
  beamCrossSectionAxis: 'beam-cross-section-axis',
  beamCrossSectionIndex: 'beam-cross-section-index',
  beamCrossSectionChart: 'beam-cross-section-chart',

  // Fiber
  fiberNA: 'fiber-na-slider',
  fiberCore: 'fiber-core-slider',
  fiberSchematic: 'fiber-schematic',

  // Microscope
  microscopeMode: 'microscope-mode-toggle',
  microscopePSFChart: 'microscope-psf-chart',

  // Raman
  ramanChart: 'raman-chart',
  ramanBaselineToggle: 'raman-baseline-toggle',
  ramanLambda: 'raman-lambda-slider',
  ramanP: 'raman-p-slider',
  ramanFitBtn: 'raman-fit-btn',
  ramanFitTable: 'raman-fit-table',

  // OCT
  octImage: 'oct-image',
  octDepthChart: 'oct-depth-chart',
  octBscanCanvas: 'oct-bscan-canvas',
  octRenderedFrom: 'oct-rendered-from',
  octColumnScrubber: 'oct-column-scrubber',

  // Image processing
  imgCanvas: 'img-canvas',
  imgFilterGray: 'img-filter-gray',
  imgFilterThreshold: 'img-filter-threshold',
  imgFilterEdge: 'img-filter-edge',
  imgFilterReset: 'img-filter-reset',

  // SIM
  simToggle: 'sim-toggle',
  simComparison: 'sim-comparison',

  // System Builder
  systemBuilderCheckbox: (id) => `system-builder-checkbox-${id}`,
  systemBuilderName: 'system-builder-name',
  systemBuilderCompile: 'system-builder-compile',

  // Results Dashboard
  resultsList: 'results-list',
  resultCard: (id) => `result-card-${id}`,
  resultDelete: (id) => `result-delete-${id}`,
  resultsClear: 'results-clear',

  // Report
  reportPrint: 'report-print',
  reportExport: 'report-export',
};
