import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import AnimatedPlayerStats from '../components/AnimatedPlayerStats';

const TestRealTime = () => {
  const { user } = useAuth();
  const { isConnected, lastMessage, requestStatsUpdate } = useWebSocket();
  const [messages, setMessages] = useState([]);
  
  // Add new messages to the list
  useEffect(() => {
    if (lastMessage) {
      setMessages(prev => [...prev, lastMessage].slice(-10)); // Keep last 10 messages
    }
  }, [lastMessage]);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Real-Time Updates Test</h1>
      
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Connection Status</h2>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
        
        {user ? (
          <div className="text-gray-300">
            <p>Logged in as: <span className="font-semibold">{user.username}</span></p>
            {user.mcUsername && (
              <p>Minecraft account: <span className="font-semibold">{user.mcUsername}</span></p>
            )}
          </div>
        ) : (
          <p className="text-yellow-500">Not logged in. Please log in to see real-time updates.</p>
        )}
        
        <button 
          onClick={requestStatsUpdate}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          disabled={!isConnected}
        >
          Request Stats Update
        </button>
      </div>
      
      {user?.mcUsername && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Player Stats</h2>
          <AnimatedPlayerStats />
        </div>
      )}
      
      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4">Recent Messages</h2>
        
        {messages.length === 0 ? (
          <p className="text-gray-400 italic">No messages received yet.</p>
        ) : (
          <div className="space-y-2">
            {messages.map((msg, index) => (
              <div key={index} className="bg-gray-700 p-3 rounded-md">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold">{msg.type || 'Message'}</span>
                  <span className="text-gray-400">{new Date(msg.timestamp || Date.now()).toLocaleTimeString()}</span>
                </div>
                <pre className="text-xs bg-gray-900 p-2 rounded overflow-x-auto">
                  {JSON.stringify(msg, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="mt-8 bg-yellow-800/30 border border-yellow-600/30 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-400 mb-2">How to Test</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-300">
          <li>Make sure you're logged in and have a Minecraft account linked</li>
          <li>On the server, run: <code className="bg-gray-800 px-2 py-1 rounded">node test-realtime-updates.js YOUR_USER_ID</code></li>
          <li>Watch as the stats update in real-time with animations</li>
          <li>Check the "Recent Messages" section to see the raw data being received</li>
        </ol>
      </div>
    </div>
  );
};

export default TestRealTime; 