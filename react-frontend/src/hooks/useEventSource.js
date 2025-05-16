import { useState, useEffect } from 'react';

/**
 * Custom hook for Server-Sent Events (SSE) connections
 * @param {string} url - The URL to connect to for SSE
 * @param {Object} options - Additional options
 * @param {Function} options.onMessage - Callback function for when a message is received
 * @param {Function} options.onOpen - Callback function for when the connection is opened
 * @param {Function} options.onError - Callback function for when an error occurs
 * @param {boolean} options.autoReconnect - Whether to automatically reconnect on connection close (default: true)
 * @param {number} options.reconnectInterval - Interval in ms to attempt reconnection (default: 3000)
 * @param {number} options.maxReconnectAttempts - Maximum number of reconnect attempts (default: 5)
 * @returns {Object} - { connected, error, lastEvent, close }
 */
export default function useEventSource(url, options = {}) {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [lastEvent, setLastEvent] = useState(null);
  const [eventSource, setEventSource] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const {
    onMessage,
    onOpen,
    onError,
    autoReconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5
  } = options;

  useEffect(() => {
    let reconnectTimer;
    
    const connect = () => {
      try {
        console.log(`[SSE] Connecting to ${url}`);
        const newEventSource = new EventSource(url);
        
        newEventSource.onopen = (e) => {
          console.log('[SSE] Connection opened');
          setConnected(true);
          setError(null);
          setReconnectAttempts(0);
          if (onOpen) onOpen(e);
        };
        
        newEventSource.onmessage = (e) => {
          console.log(`[SSE] Message received:`, e.data);
          try {
            const parsedData = JSON.parse(e.data);
            setLastEvent(parsedData);
            if (onMessage) onMessage(parsedData, e);
          } catch (err) {
            console.error('[SSE] Error parsing event data:', err);
            setLastEvent(e.data);
            if (onMessage) onMessage(e.data, e);
          }
        };
        
        newEventSource.onerror = (e) => {
          console.error('[SSE] Connection error:', e);
          setError(e);
          if (onError) onError(e);
          
          if (newEventSource.readyState === EventSource.CLOSED) {
            setConnected(false);
            
            if (autoReconnect && reconnectAttempts < maxReconnectAttempts) {
              const nextAttempt = reconnectAttempts + 1;
              console.log(`[SSE] Reconnecting, attempt ${nextAttempt}/${maxReconnectAttempts}...`);
              setReconnectAttempts(nextAttempt);
              reconnectTimer = setTimeout(connect, reconnectInterval);
            } else if (reconnectAttempts >= maxReconnectAttempts) {
              console.log('[SSE] Max reconnect attempts reached, giving up');
            }
          }
        };
        
        setEventSource(newEventSource);
        
        return newEventSource;
      } catch (err) {
        console.error('[SSE] Failed to connect:', err);
        setError(err);
        setConnected(false);
        if (onError) onError(err);
        
        if (autoReconnect && reconnectAttempts < maxReconnectAttempts) {
          const nextAttempt = reconnectAttempts + 1;
          console.log(`[SSE] Reconnecting, attempt ${nextAttempt}/${maxReconnectAttempts}...`);
          setReconnectAttempts(nextAttempt);
          reconnectTimer = setTimeout(connect, reconnectInterval);
        }
        
        return null;
      }
    };
    
    const es = connect();
    
    // Cleanup function
    return () => {
      console.log('[SSE] Cleanup, closing connection');
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      
      if (es) {
        es.close();
      }
      
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [url]); // Only reconnect if the URL changes
  
  const close = () => {
    if (eventSource) {
      console.log('[SSE] Manually closing connection');
      eventSource.close();
      setEventSource(null);
      setConnected(false);
    }
  };
  
  return { connected, error, lastEvent, close };
}