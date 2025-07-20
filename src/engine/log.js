// src/engine/log.js
export function pushLog(state, message) {
  if (!Array.isArray(state.log)) state.log = [];
  state.log.push(message);
}

export function safePushLog(state, message) {
  try { pushLog(state, message); } catch(e) { /* swallow */ }
}

// Optional: trim to prevent huge growth
export function trimLog(state, keepLast = 500) {
  if (Array.isArray(state.log) && state.log.length > keepLast) {
    state.log.splice(0, state.log.length - keepLast);
  }
}
