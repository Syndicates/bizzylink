# BizzyLink Backend

---

## Overview

**BizzyLink Backend** powers the integration between the Bizzy Nation website and Minecraft server, providing secure, real-time, and feature-rich connectivity for user accounts, player data, ranks, notifications, and more. It is designed for extensibility, security, and maintainability, following Bizzy Nation's best practices.

### Goals
- **Seamless Minecraft ↔ Website account linking**
- **Real-time player data sync** (economy, ranks, stats, achievements)
- **Robust authentication and security**
- **Forum, friends, notifications, and social features**
- **Easy integration with Minecraft plugins (LuckPerms, Essentials, etc.)**
- **Maintainable, well-documented, and extensible codebase**

---

## Architecture

- **Node.js/Express** REST API
- **MongoDB** for persistent storage (users, link codes, logs, etc.)
- **Socket.IO** for real-time notifications and plugin communication
- **Modular structure**: routes, models, middleware, services, utils
- **Security**: JWT auth, rate limiting, helmet, CORS, input validation
- **Logging**: Winston-based, emoji/color-coded, with file and console output

### Main Components
- `src/server.js` — Main entry point, sets up Express, Socket.IO, MongoDB, and routes
- `src/routes/` — API endpoints (auth, minecraft, forum, achievements, etc.)
- `src/models/` — Mongoose schemas (User, LinkCode, Notification, etc.)
- `src/services/` — Business logic (e.g., LuckPermsSync)
- `src/middleware/` — Auth, error handling, rate limiting
- `src/utils/` — Logger, error helpers

---

## API & Integration Points

### Key Endpoints
- `/api/auth` — Registration, login, JWT, 2FA
- `/api/minecraft` — Link/verify Minecraft accounts, sync player data, notify events
- `/api/linkcode` — Generate/validate link codes for plugin integration
- `/api/forum`, `/api/achievements`, `/api/titles`, `/api/notifications`, `/api/profile`, `/api/friends`, `/api/following` — Social and user features

### Minecraft Plugin Integration
- **Configurable endpoints** in `mc-plugin/src/main/resources/config.yml`
- Real-time updates via `/api/minecraft/notify` and Socket.IO
- LuckPerms, Essentials, Vault, and other plugin data sync supported

---

## Setup & Environment

### Prerequisites
- **Node.js** v16+
- **MongoDB** (default port 27017)

### Environment Variables
Create a `.env` file in `/backend` (see `.env.example` if available):
```
MONGO_URI=mongodb://localhost:27017/bizzylink
JWT_SECRET=your-very-secret-key
CORS_ORIGIN=http://localhost:3000
LUCKPERMS_API_URL=http://localhost:8085 # (if using LuckPerms API)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
ADMIN_RATE_LIMIT_MAX=200
INTERNAL_EVENT_SECRET=your-internal-secret
LOG_LEVEL=info
```

### Install & Run
```sh
cd backend
npm install
npm run dev   # for development (nodemon)
npm start     # for production
```

---

## Development Practices
- **No mock data in production** — always use real API/database data
- **Comprehensive error handling** — all API calls return clear error states
- **Proper loading states** — for all data fetches
- **Security** — input validation, JWT, rate limiting, CORS, helmet
- **Logging** — all actions/events are logged with context
- **Test coverage** — use Jest and Supertest for unit/integration tests
- **Code comments** — explain complex logic, document all endpoints and models
- **Copyright** — every file includes Bizzy Nation copyright header

---

## Security & Logging
- **JWT authentication** for all protected routes
- **Role-based access control** (admin, moderator, user, etc.)
- **Security logs** for all sensitive actions (login, linking, rank changes, etc.)
- **Winston logger** with emoji/color legend, file and console output
- **Rate limiting** on all API endpoints
- **Helmet** for HTTP header security

---

## Extending & Maintaining
- **Add new endpoints** in `src/routes/` and document them
- **Add new models** in `src/models/`
- **Add new services** in `src/services/`
- **Update plugin config** (`mc-plugin/src/main/resources/config.yml`) for new endpoints
- **Follow BizzyLink best practices** (see `/TO_DO_LIST.md` and project rules)
- **Document all changes** in code and commit messages

---

## Copyright
```
/**
 * +----+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy [year]         |
 * +----+
 *
 * @file [filename]
 * @description [brief description of the file]
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 *
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */
```

---

## Need Help?
- See `/TO_DO_LIST.md` for open tasks and priorities
- Check `/logs/` for error and combined logs
- Contact Bizzy Nation team for further onboarding 