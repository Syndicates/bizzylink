# SSE (Server-Sent Events) Refactor Guide

## Overview
The SSE system has been refactored to improve performance, error handling, and maintainability while maintaining 100% backward compatibility.

## Key Improvements

### 1. **Internal Event Emitter**
- Added a lightweight internal event emitter alongside window events
- Provides better performance and memory management
- Events are batched with a 50ms delay to prevent rapid re-renders
- Window events still work for backward compatibility

### 2. **Enhanced Error Handling**
- Exponential backoff reconnection (1s, 2s, 4s, 8s, 16s, max 30s)
- Maximum 5 reconnection attempts before showing error
- Clear error messages for users

### 3. **Connection Statistics**
- Track connection time, reconnect attempts, and events received
- Heartbeat monitoring to detect stale connections
- Available via `connectionStats` in the context

### 4. **Performance Optimizations**
- Memoized context values prevent unnecessary re-renders
- Event batching reduces rapid state updates
- Proper cleanup of all timers and listeners

### 5. **Better Debugging**
- DEBUG flag for development logging
- Connection statistics for monitoring
- Event emitter access in development mode

## API Compatibility

### Existing API (100% Compatible)
```javascript
const { addEventListener, isConnected, lastEvent, error } = useEventSource();

// Still works exactly the same
const unsubscribe = addEventListener('wall_post', (event) => {
  console.log('Wall post event:', event);
});
```

### New Features (Optional)
```javascript
const { 
  connectionStats,  // New: connection statistics
  emitEvent,       // New: manual event emission
  connect,         // New: manual reconnect
  disconnect       // New: manual disconnect
} = useEventSource();

// Check connection health
console.log('Connected for:', connectionStats.connectedAt);
console.log('Events received:', connectionStats.eventsReceived);

// Emit test event (development only)
emitEvent('test_event', { data: 'test' });
```

## Event Handling

### Event Format (Unchanged)
```javascript
// Backend emits:
eventEmitter.emit('wall_post', {
  type: 'new_post',
  post: postData,
  wallOwnerUsername: 'user123'
});

// Frontend receives:
addEventListener('wall_post', (event) => {
  // event = { type: 'new_post', post: {...}, wallOwnerUsername: 'user123' }
});
```

### Batched Events
When multiple events of the same type arrive rapidly:
```javascript
addEventListener('stats_update', (event) => {
  if (event.batch) {
    // Multiple events batched together
    event.data.forEach(stat => updateStat(stat));
  } else {
    // Single event
    updateStat(event);
  }
});
```

## Best Practices

### 1. Always Clean Up Listeners
```javascript
useEffect(() => {
  const unsubscribe = addEventListener('my_event', handler);
  return unsubscribe; // ← Important!
}, [addEventListener]);
```

### 2. Handle Connection Errors
```javascript
const { error, isConnected } = useEventSource();

if (error && !isConnected) {
  return <div>Connection lost. Please refresh the page.</div>;
}
```

### 3. Use Event Types Consistently
```javascript
// Good: Consistent event naming
addEventListener('wall_post', handler);
addEventListener('wall_comment', handler);
addEventListener('wall_like', handler);

// Bad: Inconsistent naming
addEventListener('wallPost', handler);
addEventListener('wall-comment', handler);
addEventListener('WALL_LIKE', handler);
```

## Migration Checklist

✅ **No Breaking Changes** - All existing code continues to work
✅ **Performance Improved** - Event batching reduces re-renders
✅ **Error Handling Enhanced** - Better reconnection logic
✅ **Debugging Improved** - Connection stats and logging
✅ **Memory Leaks Fixed** - Proper cleanup of all resources

## Troubleshooting

### Connection Issues
1. Check browser console for SSE errors
2. Verify authentication token is valid
3. Check `connectionStats.reconnectAttempts`
4. Ensure backend SSE endpoint is running

### Event Not Received
1. Verify event name matches exactly
2. Check if listener is properly registered
3. Look for batched events (event.batch = true)
4. Enable DEBUG mode in development

### Performance Issues
1. Events are batched by default (50ms delay)
2. Use `emitEvent(name, data, true)` for immediate events
3. Implement debouncing in event handlers if needed
4. Use React.memo() on components receiving events

## Future Enhancements (Planned)
- TypeScript event type definitions
- Event filtering by criteria
- Offline queue for events
- Compression for large payloads
- WebSocket upgrade option 