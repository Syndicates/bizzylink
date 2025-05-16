/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2024           |
 * +-------------------------------------------------+
 * 
 * @file add-copyright-headers.js
 * @description Script to add copyright headers to source files
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const readdirAsync = promisify(fs.readdir);
const statAsync = promisify(fs.stat);

// Skip these directories
const ignoreDirs = [
  'node_modules',
  '.git',
  'build',
  'dist',
  'tmp',
  'logs',
  'public'
];

// File extensions to add headers to
const codeExtensions = {
  '.js': { commentStart: '/**', commentLine: ' * ', commentEnd: ' */' },
  '.jsx': { commentStart: '/**', commentLine: ' * ', commentEnd: ' */' },
  '.ts': { commentStart: '/**', commentLine: ' * ', commentEnd: ' */' },
  '.tsx': { commentStart: '/**', commentLine: ' * ', commentEnd: ' */' },
  '.java': { commentStart: '/**', commentLine: ' * ', commentEnd: ' */' },
  '.css': { commentStart: '/**', commentLine: ' * ', commentEnd: ' */' },
  '.scss': { commentStart: '/**', commentLine: ' * ', commentEnd: ' */' },
};

// Get the current year
const currentYear = new Date().getFullYear();

// Create the header for a specific file type
function createHeader(filePath, commentConfig) {
  const { commentStart, commentLine, commentEnd } = commentConfig;
  const filename = path.basename(filePath);
  
  return `${commentStart}
${commentLine}+-------------------------------------------------+
${commentLine}|                 BIZZY NATION                    |
${commentLine}|          Crafted with ♦ by Bizzy ${currentYear}         |
${commentLine}+-------------------------------------------------+
${commentLine}
${commentLine}@file ${filename}
${commentLine}@description 
${commentLine}@copyright © Bizzy Nation - All Rights Reserved
${commentLine}@license Proprietary - Not for distribution
${commentLine}
${commentLine}This file is protected intellectual property of Bizzy Nation.
${commentLine}Unauthorized use, copying, or distribution is prohibited.
${commentEnd}

`;
}

// Check if file already has a copyright header
async function hasHeader(filePath) {
  try {
    const data = await readFileAsync(filePath, 'utf8');
    return data.includes('Bizzy Nation') && 
           (data.includes('copyright') || data.includes('Copyright'));
  } catch (err) {
    console.error(`Error reading file ${filePath}:`, err);
    return false;
  }
}

// Add header to a file
async function addHeaderToFile(filePath) {
  try {
    const ext = path.extname(filePath);
    if (!codeExtensions[ext]) return;

    if (await hasHeader(filePath)) {
      console.log(`${filePath} already has a header, skipping.`);
      return;
    }

    const data = await readFileAsync(filePath, 'utf8');
    const header = createHeader(filePath, codeExtensions[ext]);
    await writeFileAsync(filePath, header + data, 'utf8');
    console.log(`Added header to ${filePath}`);
  } catch (err) {
    console.error(`Error adding header to ${filePath}:`, err);
  }
}

// Recursively scan directories
async function processDirectory(dirPath) {
  try {
    const files = await readdirAsync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = await statAsync(filePath);
      
      // If directory and not in ignore list, process it
      if (stats.isDirectory()) {
        if (!ignoreDirs.includes(file)) {
          await processDirectory(filePath);
        }
      } 
      // If it's a file with an extension we care about, add header
      else if (stats.isFile() && codeExtensions[path.extname(file)]) {
        await addHeaderToFile(filePath);
      }
    }
  } catch (err) {
    console.error(`Error processing directory ${dirPath}:`, err);
  }
}

// Main function
async function main() {
  const rootDir = process.cwd();
  console.log(`Adding copyright headers to all source files in ${rootDir}...`);
  
  const directoriesToProcess = [
    'backend',
    'react-frontend',
    'routes',
    'middleware',
    'models',
    'src',
    'scripts',
    // Add mc-plugin Java files
    'mc-plugin/src/main/java'
  ];
  
  // Process individual files in the root directory
  const rootFiles = [
    'server.js',
    'db.js',
    'eventEmitter.js',
    'direct-auth-server.js',
    'enhanced-server.js',
    'player-stats-server.js',
    'start-servers.js'
  ];
  
  for (const dir of directoriesToProcess) {
    const dirPath = path.join(rootDir, dir);
    if (fs.existsSync(dirPath)) {
      await processDirectory(dirPath);
    }
  }
  
  for (const file of rootFiles) {
    const filePath = path.join(rootDir, file);
    if (fs.existsSync(filePath)) {
      await addHeaderToFile(filePath);
    }
  }
  
  console.log('Finished adding copyright headers to source files.');
}

main().catch(err => {
  console.error('Error in main process:', err);
}); 