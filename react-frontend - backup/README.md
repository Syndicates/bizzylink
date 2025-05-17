# BizzyLink React Frontend

This is the modern React frontend for the BizzyLink Minecraft Account Linking System. It provides a beautiful, responsive interface for users to link their Minecraft accounts with the web platform.

## Features

- Modern, responsive design with Minecraft-inspired aesthetics
- Secure user authentication with JWT
- Dashboard for viewing linked account status and player statistics
- Admin panel for user management
- Animated UI elements with Framer Motion
- Mobile-friendly interface

## Tech Stack

- React 18
- React Router v6
- Tailwind CSS for styling
- Framer Motion for animations
- Headless UI for accessible components
- Axios for API requests
- JWT for authentication

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Backend API server running (see main project README)

### Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file in the root directory with the following:
   ```
   REACT_APP_API_URL=http://localhost:3000
   ```

3. Start the development server:
   ```
   npm start
   ```

### Building for Production

```
npm run build
```

## Connecting to the Backend

This frontend is designed to work with the BizzyLink Express.js backend. Make sure the backend server is running at the URL specified in your `.env` file.

## Folder Structure

- `/src/components` - Reusable UI components
- `/src/pages` - Page components for each route
- `/src/contexts` - React context providers, including auth
- `/src/services` - API service layer
- `/src/hooks` - Custom React hooks
- `/src/utils` - Utility functions
- `/src/assets` - Static assets like images and fonts

## License

MIT
