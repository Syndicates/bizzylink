# Real-Time SSE Debugging Postmortem

## Context

This document records the full journey of diagnosing and fixing the real-time (SSE) update pipeline for the BizzyLink dashboard. The issue took two days to resolve and involved both frontend and backend investigation. This postmortem is intended to ensure the solution and lessons are never forgotten.

---

## Problem Summary

- **Symptoms:**
  - Real-time stat updates (e.g., balance changes) were received by the backend and sent via SSE to the frontend.
  - The frontend console showed SSE events being received and parsed.
  - However, the dashboard UI never updated in real time—values only changed after a manual refresh or polling.
  - No errors were thrown, and the data pipeline (MC plugin → backend → frontend) was confirmed to be working.

- **Impact:**
  - Real-time features appeared broken to users.
  - Debugging was complicated by the fact that all network and backend layers were functioning as expected.

---

## Root Cause

- The **EventSourceContext** in the frontend was receiving and parsing SSE events, but **was not dispatching them to the React app's listeners**.
- The custom event system (`addEventListener`) in the React context was never called, so hooks like `useRealTimeStats` never saw the updates.
- The SSE handler in the hook was waiting for custom events (e.g., `'player_stat_update'`), but these were never emitted.

---

## Key Debugging Steps

1. **Confirmed SSE events were received and parsed in the frontend.**
2. **Added debug logs to the hook's event handler**—discovered the handler was never called for real-time events.
3. **Traced the event flow:**
   - SSE events were handled in the context's `es.onmessage`.
   - No custom events were dispatched to the app.
4. **Verified the custom event system:**
   - The `addEventListener` in the context was a wrapper for the native EventSource, but the backend was sending all events as `onmessage` (not named events).
   - The hook was subscribing to custom events, but none were being dispatched.
5. **Hypothesis:** The bridge between raw SSE events and the app's event system was missing.
6. **Solution:**
   - In the EventSource context, after parsing each SSE event, **dispatch a custom event on `window` using the event's `type`**.
   - Update `addEventListener` to listen on `window` for these custom events and call the provided callback with the event data.

---

## The Final Fix

**In `react-frontend/src/contexts/EventSourceContext.js`:**

1. **Dispatch custom events for each SSE message:**

```js
es.onmessage = (event) => {
  try {
    const parsed = JSON.parse(event.data);
    if (parsed.type) {
      window.dispatchEvent(new CustomEvent(parsed.type, { detail: parsed }));
    }
  } catch (e) {
    // ...
  }
};
```

2. **Update `addEventListener` to listen on `window`:**

```js
const addEventListener = useCallback((event, callback) => {
  const handler = (e) => callback(e.detail);
  window.addEventListener(event, handler);
  return () => window.removeEventListener(event, handler);
}, []);
```

---

## Lessons Learned

- **Always ensure the frontend event system bridges raw SSE events to React listeners.**
- **Debug with logs at every layer:** Confirm not just receipt of data, but also that listeners are triggered.
- **Custom event dispatch is required** when using a context/provider pattern with SSE in React.
- **Don't assume the event system is working just because the network layer is.**

---

## Checklist for Future Real-Time Features

- [ ] Confirm backend emits correct SSE events.
- [ ] Confirm frontend receives and parses events.
- [ ] Confirm custom events are dispatched to the app's listeners.
- [ ] Confirm hooks/components receive and process updates.
- [ ] Add debug logs at each step for visibility.

---

**This postmortem must be reviewed by all future developers working on real-time features.** 