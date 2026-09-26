// Minimal NPY parser (numpy .npy files) for browser use.
// Supports 2D arrays, C-order, dtypes: <f4, <f8, <i2, <i4, <u1, <u2.
// Returns { data (typed array, length = prod(shape)), shape, dtype, matrix (2D array for 2D shapes) }.

const readHeader = (bytes) => {
  // Magic \x93NUMPY
  if (bytes[0] !== 0x93) throw new Error('Not an NPY file');
  const magic = String.fromCharCode(bytes[1], bytes[2], bytes[3], bytes[4], bytes[5]);
  if (magic !== 'NUMPY') throw new Error('Bad NPY magic');
  const major = bytes[6];
  const minor = bytes[7];
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let headerLen, headerStart;
  if (major >= 2) {
    headerLen = view.getUint32(8, true);
    headerStart = 12;
  } else {
    headerLen = view.getUint16(8, true);
    headerStart = 10;
  }
  const headerText = new TextDecoder('utf-8').decode(bytes.slice(headerStart, headerStart + headerLen));
  return { headerText, headerStart, headerLen, dataStart: headerStart + headerLen, version: `${major}.${minor}` };
};

const parseNpyHeader = (text) => {
  // Header is a Python literal dict:  {'descr': '<f4', 'fortran_order': False, 'shape': (256, 256), }
  const descrMatch = text.match(/['"]descr['"]\s*:\s*['"]([^'"]+)['"]/);
  const shapeMatch = text.match(/['"]shape['"]\s*:\s*\(([^)]*)\)/);
  const fortranMatch = text.match(/['"]fortran_order['"]\s*:\s*(True|False)/);
  if (!descrMatch || !shapeMatch) throw new Error('Malformed NPY header');
  const shape = shapeMatch[1].split(',').map((s) => s.trim()).filter(Boolean).map(Number);
  return {
    dtype: descrMatch[1],
    shape,
    fortranOrder: fortranMatch ? fortranMatch[1] === 'True' : false,
  };
};

const readTypedArray = (buffer, byteOffset, count, dtype) => {
  const view = new DataView(buffer, byteOffset);
  let arr;
  switch (dtype) {
    case '<f4':
    case '=f4':
    case 'f4': {
      arr = new Float32Array(count);
      for (let i = 0; i < count; i++) arr[i] = view.getFloat32(i * 4, true);
      break;
    }
    case '<f8':
    case '=f8':
    case 'f8': {
      arr = new Float64Array(count);
      for (let i = 0; i < count; i++) arr[i] = view.getFloat64(i * 8, true);
      break;
    }
    case '<i2':
    case '=i2': {
      arr = new Float32Array(count);
      for (let i = 0; i < count; i++) arr[i] = view.getInt16(i * 2, true);
      break;
    }
    case '<i4':
    case '=i4': {
      arr = new Float32Array(count);
      for (let i = 0; i < count; i++) arr[i] = view.getInt32(i * 4, true);
      break;
    }
    case '<u1':
    case '=u1':
    case '|u1':
    case 'u1': {
      arr = new Float32Array(count);
      const u8 = new Uint8Array(buffer, byteOffset, count);
      for (let i = 0; i < count; i++) arr[i] = u8[i];
      break;
    }
    case '<u2':
    case '=u2': {
      arr = new Float32Array(count);
      for (let i = 0; i < count; i++) arr[i] = view.getUint16(i * 2, true);
      break;
    }
    default:
      throw new Error(`Unsupported NPY dtype: ${dtype}`);
  }
  return arr;
};

export const parseNpy = (arrayBuffer) => {
  const bytes = new Uint8Array(arrayBuffer);
  const { headerText, dataStart } = readHeader(bytes);
  const { dtype, shape, fortranOrder } = parseNpyHeader(headerText);
  const total = shape.reduce((a, b) => a * b, 1);
  const data = readTypedArray(arrayBuffer, dataStart, total, dtype);

  // Build 2D matrix if applicable
  let matrix = null;
  if (shape.length === 2) {
    const [rows, cols] = shape;
    matrix = new Array(rows);
    if (fortranOrder) {
      for (let r = 0; r < rows; r++) {
        matrix[r] = new Float32Array(cols);
        for (let c = 0; c < cols; c++) matrix[r][c] = data[c * rows + r];
      }
    } else {
      for (let r = 0; r < rows; r++) {
        matrix[r] = new Float32Array(cols);
        for (let c = 0; c < cols; c++) matrix[r][c] = data[r * cols + c];
      }
    }
  }

  return { data, shape, dtype, fortranOrder, matrix };
};

/**
 * Render a 2D matrix (rows × cols) onto a canvas with a hot colormap.
 * Values are normalized to [0, 1] before mapping.
 * Returns the canvas.toDataURL('image/png') string.
 */
export const renderMatrixToDataUrl = (matrix, colormap = 'viridis') => {
  if (!matrix || !matrix.length) return '';
  const rows = matrix.length;
  const cols = matrix[0].length;
  let vMin = Infinity, vMax = -Infinity;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const v = matrix[r][c];
      if (Number.isFinite(v)) {
        if (v < vMin) vMin = v;
        if (v > vMax) vMax = v;
      }
    }
  }
  const span = vMax - vMin || 1;
  const canvas = document.createElement('canvas');
  canvas.width = cols;
  canvas.height = rows;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(cols, rows);
  const data = img.data;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const v = (matrix[r][c] - vMin) / span;
      const [R, G, B] = colormap === 'hot' ? hotColor(v) : viridisColor(v);
      const idx = (r * cols + c) * 4;
      data[idx] = R; data[idx + 1] = G; data[idx + 2] = B; data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return { url: canvas.toDataURL('image/png'), vMin, vMax, shape: [rows, cols] };
};

const hotColor = (v) => {
  v = Math.min(1, Math.max(0, v));
  let r = 0, g = 0, b = 0;
  if (v < 0.375) { r = Math.round((v / 0.375) * 255); }
  else if (v < 0.75) { r = 255; g = Math.round(((v - 0.375) / 0.375) * 255); }
  else { r = 255; g = 255; b = Math.round(((v - 0.75) / 0.25) * 255); }
  return [r, g, b];
};

// Simplified viridis-ish colormap using 5 stops
const viridisStops = [
  [68, 1, 84],    // dark purple
  [59, 82, 139],  // blue
  [33, 145, 140], // teal
  [94, 201, 98],  // green
  [253, 231, 37], // yellow
];
const viridisColor = (v) => {
  v = Math.min(1, Math.max(0, v));
  const scaled = v * (viridisStops.length - 1);
  const i = Math.floor(scaled);
  const t = scaled - i;
  const a = viridisStops[i];
  const b = viridisStops[Math.min(viridisStops.length - 1, i + 1)];
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
};
