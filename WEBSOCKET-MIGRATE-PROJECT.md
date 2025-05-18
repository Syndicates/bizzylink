# BizzyLink WebSocket Migration Project Guide

---

## **Purpose**
This document provides a comprehensive, step-by-step guide for migrating BizzyLink from REST/polling-based updates to a robust, scalable, real-time WebSocket architecture. It is designed for future developers to understand, implement, and extend real-time features across all BizzyLink components: backend, Minecraft plugin, database, and frontend.

---

## **Table of Contents**
1. [Project Overview & Architecture](#project-overview--architecture)
2. [Why WebSocket?](#why-websocket)
3. [Current System: REST & Polling](#current-system-rest--polling)
4. [Target System: WebSocket Real-Time](#target-system-websocket-real-time)
5. [Migration Plan](#migration-plan)
    - Backend (Node.js)
    - Minecraft Plugin (Java)
    - API & Data Contracts
    - Database Considerations
    - Frontend Integration
    - Server Coordination
6. [Implementation Details](#implementation-details)
    - Backend WebSocket Server
    - Plugin WebSocket Client
    - Event Types & Payloads
    - Authentication & Security
    - Error Handling & Reconnect
    - Testing & Rollout
7. [Best Practices & Rules](#best-practices--rules)
8. [Reference: Project Paths & Files](#reference-project-paths--files)
9. [Appendix: Example Code & Snippets](#appendix-example-code--snippets)

---

## 1. Project Overview & Architecture

### **BizzyLink is a multi-server, multi-component system:**
- **Backend (Node.js):** Handles user auth, API, player stats, linking, leaderboards, notifications.
- **Minecraft Plugin (Java, Maven):** Communicates with backend for linking, stats, notifications.
- **Frontend (React):** Dashboard, profile, leaderboard, real-time UI.
- **Database (MongoDB):** Stores users, stats, friends, logs, etc.
- **Other Servers:**
  - `server.js` (main backend, port 8080)
  - `enhanced-server.js` (WebSocket/notifications, port 8082)
  - `direct-auth-server.js` (auth, port 8084)
  - `player-stats-server.js` (player stats, port 8081)
  - `simple-leaderboard-server.js` (leaderboard, port 8083)

**All servers are started via batch scripts and must be coordinated.**

---

## 2. Why WebSocket?
- **Instant, bidirectional communication** between backend and plugin/clients.
- **Push-based updates** for stats, leaderboards, link/unlink, notifications.
- **Lower latency, less server load** (no polling).
- **Enables new features:** live chat, real-time alerts, collaborative features.

---

## 3. Current System: REST & Polling
- Plugin and frontend poll REST endpoints for updates (e.g., `/api/player/update`, `/api/leaderboard/...`).
- Real-time updates are simulated via webhooks and frequent polling.
- Unlink/link events, stats, and leaderboard changes are not truly instant.

---

## 4. Target System: WebSocket Real-Time
- **Backend exposes a WebSocket server** (e.g., using `ws` or `socket.io`).
- **Plugin and frontend connect as WebSocket clients.**
- **All real-time events** (stats, link/unlink, leaderboard, notifications) are pushed instantly.
- **All REST endpoints remain for fallback/compatibility.**

---

## 5. Migration Plan

### **A. Backend (Node.js)**
- Add a WebSocket server (recommend: `ws` for simplicity, `socket.io` for advanced features).
- Integrate with existing event emitters (link/unlink, stats update, leaderboard change).
- Broadcast events to all or specific clients.
- Add authentication (JWT or session token on connect).
- Update REST endpoints to also emit WebSocket events when data changes.

### **B. Minecraft Plugin (Java, Maven)**
- Add a WebSocket client (recommend: `java-websocket` or `OkHttp`).
- Connect to backend WebSocket server on plugin enable.
- Listen for events: `player_unlinked`, `stats_update`, `leaderboard_update`, etc.
- Update in-game state/UI in response to events (e.g., show unlink alert, update stats).
- Send player actions/stats to backend via WebSocket (optional, for true bidirectional sync).
- Handle reconnect, error, and authentication.

### **C. API & Data Contracts**
- Define event types and payload schemas (see Implementation Details).
- Ensure all events are versioned and documented.

### **D. Database Considerations**
- No schema changes required for WebSocket, but ensure all updates are atomic and trigger events.
- Use MongoDB change streams for advanced real-time triggers (optional).

### **E. Frontend Integration**
- Update React frontend to connect to WebSocket server for real-time UI updates.
- Listen for events and update dashboard, leaderboard, notifications, etc.

### **F. Server Coordination**
- Ensure all servers (main, enhanced, stats, leaderboard, auth) can emit/receive events as needed.
- Use a central event bus or message broker (e.g., Redis pub/sub) for multi-server scaling (optional, for large deployments).

---

## 6. Implementation Details

### **A. Backend WebSocket Server**
- Add to `enhanced-server.js` or a new `websocket-server.js`.
- Use `ws` or `socket.io`:
  ```js
  // Example (Node.js, ws)
  const WebSocket = require('ws');
  const wss = new WebSocket.Server({ port: 8085 });
  wss.on('connection', (ws, req) => {
    // Authenticate using JWT/session
    // Store connection by user ID/UUID
    ws.on('message', (msg) => { /* handle incoming */ });
    // Send initial state
    ws.send(JSON.stringify({ type: 'welcome', ... }));
  });
  // Broadcast example
  function broadcast(event) {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(event));
      }
    });
  }
  ```
- Emit events on:
  - Link/unlink (`player_linked`, `player_unlinked`)
  - Stats update (`stats_update`)
  - Leaderboard update (`leaderboard_update`)
  - Notification (`notification`)

### **B. Plugin WebSocket Client**
- Add dependency (e.g., `org.java-websocket:Java-WebSocket:1.5.3`).
- Connect on plugin enable:
  ```java
  WebSocketClient client = new WebSocketClient(new URI("ws://localhost:8085")) {
    @Override
    public void onOpen(ServerHandshake handshakedata) { /* ... */ }
    @Override
    public void onMessage(String message) { /* handle event */ }
    @Override
    public void onClose(int code, String reason, boolean remote) { /* ... */ }
    @Override
    public void onError(Exception ex) { /* ... */ }
  };
  client.connect();
  ```
- Parse incoming JSON events and update in-game state:
  - If `type: 'player_unlinked'` and matches player, show in-game alert.
  - If `type: 'stats_update'`, update stats UI.
  - If `type: 'leaderboard_update'`, update leaderboard.
- Handle reconnect and authentication (send token on connect).

### **C. Event Types & Payloads**
- **player_linked**: `{ type: 'player_linked', uuid, username, ... }`
- **player_unlinked**: `{ type: 'player_unlinked', uuid, username }`
- **stats_update**: `{ type: 'stats_update', uuid, stats: { ... } }`
- **leaderboard_update**: `{ type: 'leaderboard_update', category, data: [...] }`
- **notification**: `{ type: 'notification', uuid, message, ... }`

### **D. Authentication & Security**
- Require JWT/session token on connect (send as query param or first message).
- Validate token and associate connection with user/UUID.
- Only send events to authorized clients.

### **E. Error Handling & Reconnect**
- Implement exponential backoff for reconnects.
- Handle dropped connections gracefully.
- Log all errors and connection events.

### **F. Testing & Rollout**
- Test with multiple clients (plugin, frontend, admin tools).
- Simulate all event types and verify real-time updates.
- Roll out in stages: start with unlink/link alerts, then stats, then leaderboard.
- Keep REST endpoints as fallback during migration.

---

## 7. Best Practices & Rules
- **Follow BizzyLink RULES.md**: No mock data, proper error handling, modular code, test coverage, code review, security best practices.
- **Database:** Use atomic updates, maintain indexes, document all schema changes in `database-info.md`.
- **API:** Version all event payloads, document in OpenAPI/Swagger if possible.
- **Frontend:** Use loading/error states, debounce updates, preserve previous data during refresh.
- **Plugin:** Use async tasks for network, never block main thread, handle reconnects.
- **Security:** Authenticate all WebSocket connections, never expose sensitive data in events.
- **Monitoring:** Log all connection and event activity, set up alerts for failures.

---

## 8. Reference: Project Paths & Files
- **Backend:**
  - `backend/src/routes/minecraft.js` (link/unlink, player endpoints)
  - `backend/src/models/User.js` (user schema, linking logic)
  - `enhanced-server.js`, `server.js`, `player-stats-server.js`, `simple-leaderboard-server.js`
- **Plugin:**
  - `mc-plugin/src/main/java/com/bizzynation/LinkPlugin.java`
  - `mc-plugin/src/main/java/com/bizzynation/utils/ApiService.java`
  - `mc-plugin/src/main/java/com/bizzynation/commands/LinkCommand.java`
  - `mc-plugin/src/main/java/com/bizzynation/listeners/PlayerListener.java`
- **Frontend:**
  - `react-frontend/src/pages/Dashboard.js`, `Profile.js`, `Leaderboard.js`
  - `react-frontend/src/services/api.js`
- **Database:**
  - See `database-info.md` for schema, indexes, and relationships
- **Rules:**
  - `RULES.md` (development, security, and code standards)

---

## 9. Appendix: Example Code & Snippets

### **A. Backend WebSocket Event Broadcast**
```js
// In enhanced-server.js or websocket-server.js
function broadcastEvent(event) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(event));
    }
  });
}
// Usage: broadcastEvent({ type: 'player_unlinked', uuid, username });
```

### **B. Plugin WebSocket Client Handler**
```java
@Override
public void onMessage(String message) {
  JSONObject event = new JSONObject(message);
  String type = event.getString("type");
  if (type.equals("player_unlinked")) {
    String uuid = event.getString("uuid");
    // Find player by UUID and show in-game alert
    Player player = Bukkit.getPlayer(UUID.fromString(uuid));
    if (player != null) {
      player.sendMessage(ChatColor.RED + "Your account has been unlinked from BizzyLink!");
    }
  }
  // Handle other event types...
}
```

### **C. Plugin Dependency (pom.xml)**
```xml
<dependency>
  <groupId>org.java-websocket</groupId>
  <artifactId>Java-WebSocket</artifactId>
  <version>1.5.3</version>
</dependency>
```

---

## **Final Notes**
- Keep this document updated with all changes and lessons learned during migration.
- Use feature flags to enable/disable WebSocket features during rollout.
- Always test with both plugin and frontend clients.
- For questions, see `RULES.md`, `database-info.md`, and code comments.

---

**BizzyLink WebSocket Migration Guide — Crafted for maintainability, scalability, and real-time power.** 