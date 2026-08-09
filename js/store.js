// ===== Orbit — persistent storage (localStorage) =====
// Single state object under one key. All data survives refresh / restart.

const Store = (function () {
  const KEY = 'orbit_state_v1';

  const DEFAULT_STATE = {
    chat:        [],        // [{ id, role, text, ts }]
    memories:    [],        // [{ id, text, ts }]
    medications: [],        // [{ id, name, mg, timing, ts }]
    water:       { date: null, count: 0, goal: 8 },
    projects:    [],        // [{ id, title, description, status, ts }]
    tasks:       [],        // [{ id, text, done, ts }]
    settings:    { theme: 'dark', font: 'Inter' }
  };

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return structuredClone(DEFAULT_STATE);
      const parsed = JSON.parse(raw);
      // Merge with defaults so newly added fields don't break old data
      return {
        ...structuredClone(DEFAULT_STATE),
        ...parsed,
        settings: { ...DEFAULT_STATE.settings, ...(parsed.settings || {}) },
        water:    { ...DEFAULT_STATE.water,    ...(parsed.water    || {}) }
      };
    } catch {
      return structuredClone(DEFAULT_STATE);
    }
  }

  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  }

  // ---- public API ----
  function get() { return state; }

  function set(mutator) {
    mutator(state);
    persist();
  }

  function reset() {
    state = structuredClone(DEFAULT_STATE);
    persist();
  }

  // ---- chat ----
  function addMessage(role, text) {
    const msg = { id: crypto.randomUUID(), role, text, ts: Date.now() };
    set((s) => { s.chat.push(msg); });
    return msg;
  }

  function clearChat() {
    set((s) => { s.chat = []; });
  }

  // ---- memories ----
  function addMemory(text) {
    const m = { id: crypto.randomUUID(), text, ts: Date.now() };
    set((s) => { s.memories.unshift(m); });
    return m;
  }

  function deleteMemory(id) {
    set((s) => { s.memories = s.memories.filter((m) => m.id !== id); });
  }

  // ---- medications ----
  function addMedication(name, mg, timing) {
    const m = { id: crypto.randomUUID(), name, mg, timing, ts: Date.now() };
    set((s) => { s.medications.push(m); });
    return m;
  }

  function deleteMedication(id) {
    set((s) => { s.medications = s.medications.filter((m) => m.id !== id); });
  }

  // ---- water ----
  function _today() { return new Date().toISOString().slice(0, 10); }

  function addWater() {
    set((s) => {
      if (s.water.date !== _today()) { s.water = { date: _today(), count: 0, goal: 8 }; }
      s.water.count = Math.min(s.water.goal + 10, s.water.count + 1);
    });
  }

  function removeWater() {
    set((s) => {
      if (s.water.date !== _today()) { s.water = { date: _today(), count: 0, goal: 8 }; return; }
      s.water.count = Math.max(0, s.water.count - 1);
    });
  }

  function resetWater() {
    set((s) => { s.water = { date: _today(), count: 0, goal: s.water.goal || 8 }; });
  }

  function setWaterGoal(goal) {
    const g = Math.max(1, Math.min(30, parseInt(goal, 10) || 8));
    set((s) => {
      if (s.water.date !== _today()) { s.water = { date: _today(), count: 0, goal: g }; }
      else { s.water.goal = g; }
    });
  }

  function getWater() {
    if (state.water.date !== _today()) {
      state.water = { date: _today(), count: 0, goal: state.water.goal || 8 };
      persist();
    }
    return state.water;
  }

  // ---- projects ----
  function addProject(title, description) {
    const p = { id: crypto.randomUUID(), title, description, status: 'planned', ts: Date.now() };
    set((s) => { s.projects.push(p); });
    return p;
  }

  function deleteProject(id) {
    set((s) => { s.projects = s.projects.filter((p) => p.id !== id); });
  }

  // ---- tasks ----
  function addTask(text) {
    const t = { id: crypto.randomUUID(), text, done: false, ts: Date.now() };
    set((s) => { s.tasks.unshift(t); });
    return t;
  }

  function toggleTask(id) {
    set((s) => {
      const t = s.tasks.find((x) => x.id === id);
      if (t) t.done = !t.done;
    });
  }

  function deleteTask(id) {
    set((s) => { s.tasks = s.tasks.filter((t) => t.id !== id); });
  }

  // ---- settings ----
  function setSetting(key, value) {
    set((s) => { s.settings[key] = value; });
  }

  return {
    get, set, reset,
    addMessage, clearChat,
    addMemory, deleteMemory,
    addMedication, deleteMedication,
    addWater, removeWater, resetWater, getWater, setWaterGoal,
    addProject, deleteProject,
    addTask, toggleTask, deleteTask,
    setSetting
  };
})();
