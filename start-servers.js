/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file start-servers.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const MAIN_SERVER = 'server.js';
const ENHANCED_SERVER = 'enhanced-server.js';
const LOG_DIR = path.join(__dirname, 'logs');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
}

// Create log files
const mainServerLog = fs.createWriteStream(path.join(LOG_DIR, 'main-server.log'), { flags: 'a' });
const enhancedServerLog = fs.createWriteStream(path.join(LOG_DIR, 'enhanced-server.log'), { flags: 'a' });

// Helper function to start a server
function startServer(serverFile, logStream, name) {
  console.log(`Starting ${name}...`);
  
  const server = spawn('node', [serverFile], {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false
  });
  
  // Log timestamp for server start
  const timestamp = new Date().toISOString();
  logStream.write(`\n\n[${timestamp}] === ${name} STARTED ===\n\n`);
  
  // Pipe stdout and stderr to log file
  server.stdout.pipe(logStream);
  server.stderr.pipe(logStream);
  
  // Also log to console with prefix
  server.stdout.on('data', (data) => {
    console.log(`[${name}] ${data.toString().trim()}`);
  });
  
  server.stderr.on('data', (data) => {
    console.error(`[${name} ERROR] ${data.toString().trim()}`);
  });
  
  // Handle server exit
  server.on('exit', (code, signal) => {
    const exitTimestamp = new Date().toISOString();
    const exitMessage = `\n\n[${exitTimestamp}] === ${name} EXITED (Code: ${code}, Signal: ${signal}) ===\n\n`;
    logStream.write(exitMessage);
    console.log(exitMessage);
    
    // Restart server after a delay
    console.log(`${name} exited. Restarting in 5 seconds...`);
    setTimeout(() => {
      startServer(serverFile, logStream, name);
    }, 5000);
  });
  
  return server;
}

// Start both servers
const mainServer = startServer(MAIN_SERVER, mainServerLog, 'Main Server');
const enhancedServer = startServer(ENHANCED_SERVER, enhancedServerLog, 'Enhanced Server');

// Handle process exit
process.on('SIGINT', () => {
  console.log('Shutting down servers...');
  
  // Kill server processes
  if (mainServer && !mainServer.killed) {
    mainServer.kill();
  }
  
  if (enhancedServer && !enhancedServer.killed) {
    enhancedServer.kill();
  }
  
  // Close log streams
  mainServerLog.end();
  enhancedServerLog.end();
  
  console.log('Servers shut down. Exiting...');
  process.exit(0);
});

console.log('Both servers started. Press Ctrl+C to stop.');
console.log(`Logs are being written to ${LOG_DIR}`); 