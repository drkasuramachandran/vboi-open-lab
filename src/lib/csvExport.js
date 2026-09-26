// Convert a saved snapshot into a downloadable CSV.

const escapeCsv = (v) => {
  if (v === null || v === undefined) return '';
  const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
  if (s.includes('"') || s.includes(',') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

export const snapshotToCsv = (snapshot, projectName = '') => {
  const lines = [];
  lines.push(['# VBOI Snapshot'].join(','));
  lines.push(['Instrument', escapeCsv(projectName)].join(','));
  lines.push(['Module', escapeCsv(snapshot.moduleName)].join(','));
  lines.push(['Module ID', escapeCsv(snapshot.moduleId)].join(','));
  lines.push(['Saved at', escapeCsv(snapshot.savedAt)].join(','));
  lines.push(['Summary', escapeCsv(snapshot.payload?.summary || '')].join(','));
  lines.push('');

  const params = snapshot.payload?.params || {};
  if (Object.keys(params).length > 0) {
    lines.push('Parameter,Value');
    for (const [k, v] of Object.entries(params)) {
      lines.push(`${escapeCsv(k)},${escapeCsv(v)}`);
    }
    lines.push('');
  }

  const metrics = snapshot.payload?.metrics || {};
  if (Object.keys(metrics).length > 0) {
    lines.push('Metric,Value');
    for (const [k, v] of Object.entries(metrics)) {
      lines.push(`${escapeCsv(k)},${escapeCsv(v)}`);
    }
  }

  return lines.join('\n');
};

export const downloadSnapshotCsv = (snapshot, projectName = '') => {
  const csv = snapshotToCsv(snapshot, projectName);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = (snapshot.moduleId || 'snapshot').replace(/[^a-z0-9_-]/gi, '_');
  const stamp = new Date(snapshot.savedAt || Date.now()).toISOString().replace(/[:.]/g, '-');
  a.href = url;
  a.download = `vboi_${safeName}_${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
