# BizzyLink

BizzyLink is a comprehensive web application that connects Minecraft players with a social platform. It integrates real-time Minecraft player statistics, social features, and community interaction in a modern, responsive interface.

## Project Structure

The project consists of several interconnected components:

- **React Frontend**: Modern UI built with React, Tailwind CSS, and Framer Motion
- **Node.js Backend**: Express-based API server with MongoDB integration
- **Minecraft Plugin**: Java-based Minecraft server plugin that connects with the backend
- **Enhanced Server**: Additional server for handling specialized functionality

## Features

- **Player Statistics**: Real-time tracking of Minecraft player stats
- **Social Network**: Friend requests, following, profiles, and wall posts
- **Forums & Community**: Discussion boards and community interaction
- **Authentication System**: Secure login and account linking between web and Minecraft

## Setup Instructions

### Prerequisites
- Node.js v16+ and npm
- MongoDB
- Java 17+ (for Minecraft plugin)
- Minecraft server (Paper/Spigot)

### Frontend Setup
1. Navigate to the `react-frontend` directory
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

### Backend Setup
1. Make sure MongoDB is running
2. Copy `.env.example` to `.env` and configure with your settings
3. Run `npm install` in the project root
4. Start the backend server: `npm start` or `node server.js`

### Enhanced Services
- Start all services with the provided batch scripts:
  - Windows: `start-all-servers.bat`
  - Linux/Mac: `./start.sh`

## Development Guidelines

See [RULES.md](RULES.md) and [POST_PRODUCTION_BUILD_REQUIREMENTS.md](POST_PRODUCTION_BUILD_REQUIREMENTS.md) for development standards and best practices.

## Emergency Access

For emergency login procedures, see [EMERGENCY_LOGIN.md](EMERGENCY_LOGIN.md).

## Version History

- **Version 2**: Current development branch with improved performance and features
- **original_build**: Backup of the initial stable release

## License

Proprietary software. All rights reserved. 