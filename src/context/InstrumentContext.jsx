import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { decodeShare } from '@/lib/shareEncoding';

const STORAGE_KEY = 'vboi.instrument.v1';

const InstrumentContext = createContext(null);

const emptyState = () => ({ results: [], selected: [], projectName: 'Untitled Instrument', locked: false });

const loadInitial = () => {
  // Priority: URL hash #share=... → localStorage → empty
  if (typeof window !== 'undefined') {
    const hash = window.location.hash || '';
    const match = hash.match(/#share=([^&]+)/);
    if (match) {
      const decoded = decodeShare(match[1]);
      if (decoded) {
        // Strip the share hash so a page refresh does not re-apply it
        try {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        } catch { /* ignore */ }
        return {
          results: decoded.results || [],
          selected: decoded.selected || [],
          projectName: decoded.projectName || 'Shared Instrument',
          locked: false,
          _loadedFromShare: true,
        };
      }
    }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    return {
      results: Array.isArray(parsed.results) ? parsed.results : [],
      selected: Array.isArray(parsed.selected) ? parsed.selected : [],
      projectName: typeof parsed.projectName === 'string' ? parsed.projectName : 'Untitled Instrument',
      locked: false,
    };
  } catch {
    return emptyState();
  }
};

export const InstrumentProvider = ({ children }) => {
  const [state, setState] = useState(loadInitial);

  useEffect(() => {
    // Persist without the transient _loadedFromShare flag
    try {
      const { _loadedFromShare, ...persistable } = state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
    } catch { /* ignore */ }
  }, [state]);

  const saveResult = useCallback((moduleId, moduleName, payload) => {
    const entry = {
      id: `${moduleId}-${Date.now()}`,
      moduleId,
      moduleName,
      savedAt: new Date().toISOString(),
      payload,
    };
    setState((s) => ({ ...s, results: [entry, ...s.results].slice(0, 60) }));
    return entry;
  }, []);

  const deleteResult = useCallback((id) => {
    setState((s) => ({ ...s, results: s.results.filter((r) => r.id !== id) }));
  }, []);

  const clearResults = useCallback(() => {
    setState((s) => ({ ...s, results: [], selected: [] }));
  }, []);

  const toggleSelected = useCallback((moduleId) => {
    setState((s) => ({
      ...s,
      selected: s.selected.includes(moduleId)
        ? s.selected.filter((x) => x !== moduleId)
        : [...s.selected, moduleId],
    }));
  }, []);

  const setProjectName = useCallback((name) => {
    setState((s) => ({ ...s, projectName: name }));
  }, []);

  const clearShareFlag = useCallback(() => {
    setState((s) => {
      if (!s._loadedFromShare) return s;
      const { _loadedFromShare, ...rest } = s;
      return rest;
    });
  }, []);

  const importState = useCallback((decoded) => {
    if (!decoded) return;
    setState({
      results: decoded.results || [],
      selected: decoded.selected || [],
      projectName: decoded.projectName || 'Imported Instrument',
    });
  }, []);

  const loadPreset = useCallback((preset) => {
    if (!preset || !Array.isArray(preset.snapshots)) return;
    const now = Date.now();
    const results = preset.snapshots.map((s, i) => ({
      id: `${s.moduleId}-preset-${now}-${i}`,
      moduleId: s.moduleId,
      moduleName: s.moduleName,
      savedAt: new Date(now - i * 1000).toISOString(),
      payload: s.payload,
    }));
    setState((s) => ({
      ...s,
      projectName: preset.name,
      selected: Array.isArray(preset.selected) ? preset.selected : [],
      results,
    }));
  }, []);

  const toggleLock = useCallback(() => {
    setState((s) => ({ ...s, locked: !s.locked }));
  }, []);

  const value = useMemo(() => ({
    ...state,
    saveResult,
    deleteResult,
    clearResults,
    toggleSelected,
    setProjectName,
    clearShareFlag,
    importState,
    loadPreset,
    toggleLock,
  }), [state, saveResult, deleteResult, clearResults, toggleSelected, setProjectName, clearShareFlag, importState, loadPreset, toggleLock]);

  return <InstrumentContext.Provider value={value}>{children}</InstrumentContext.Provider>;
};

export const useInstrument = () => {
  const ctx = useContext(InstrumentContext);
  if (!ctx) throw new Error('useInstrument must be used within InstrumentProvider');
  return ctx;
};
