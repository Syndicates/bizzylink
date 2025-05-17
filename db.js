/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file db.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

const mongoose = require('mongoose');
const EventEmitter = require('events');

const dbEvents = new EventEmitter();
let connected = false;

async function connectDB() {
  if (connected) return mongoose.connection;
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/bizzylink', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      maxPoolSize: 30,
      minPoolSize: 5,
      heartbeatFrequencyMS: 10000
    });
    connected = true;
    dbEvents.emit('connected');
    console.log('Connected to MongoDB (bizzylink)');
    mongoose.connection.on('disconnected', () => {
      connected = false;
      dbEvents.emit('disconnected');
      console.log('MongoDB disconnected. Attempting to reconnect...');
      setTimeout(connectDB, 5000);
    });
    mongoose.connection.on('reconnected', () => {
      connected = true;
      dbEvents.emit('reconnected');
      console.log('MongoDB reconnected');
    });
    return mongoose.connection;
  } catch (err) {
    connected = false;
    dbEvents.emit('error', err);
    console.error('MongoDB connection error:', err);
    setTimeout(connectDB, 5000);
    throw err;
  }
}

function isConnected() {
  return connected && mongoose.connection.readyState === 1;
}

async function withConnection(fn) {
  if (!isConnected()) throw new Error('Not connected to DB');
  return fn();
}

module.exports = {
  connectDB,
  isConnected,
  withConnection,
  dbEvents,
  mongoose
}; 