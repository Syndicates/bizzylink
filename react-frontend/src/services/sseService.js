source.addEventListener('message', (event) => {
  console.log('[FRONTEND SSE] Received event:', event);
  try {
    const data = JSON.parse(event.data);
    console.log('[FRONTEND SSE] Parsed event data:', data);
    // ... existing code ...
  } catch (err) {
    console.error('[FRONTEND SSE] Error parsing event data:', err, event.data);
  }
}); 