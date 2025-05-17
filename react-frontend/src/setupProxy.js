/**
 * +-------------------------------------------------+
 * |                 BIZZY NATION                    |
 * |          Crafted with ♦ by Bizzy 2025         |
 * +-------------------------------------------------+
 * 
 * @file setupProxy.js
 * @description 
 * @copyright © Bizzy Nation - All Rights Reserved
 * @license Proprietary - Not for distribution
 * 
 * This file is protected intellectual property of Bizzy Nation.
 * Unauthorized use, copying, or distribution is prohibited.
 */

const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  console.log('Proxy setup is running!');
  
  // Add more detailed debug logs for proxy
  const apiProxy = createProxyMiddleware({
    target: 'http://localhost:8080', // Use the correct port for your backend
    changeOrigin: true,
    secure: false,
    logLevel: 'debug',
    pathRewrite: {
      '^/api': '/api', // No path rewriting needed for standard API routes
    },
    onProxyReq: (proxyReq, req, res) => {
      // Log outgoing proxy requests
      console.log(`[Proxy] ${req.method} ${req.path} -> ${proxyReq.path}`);
      
      // For POST requests, log the body size to help debug
      if (req.method === 'POST') {
        if (req.body) {
          const bodySize = JSON.stringify(req.body).length;
          console.log(`[Proxy] POST body size: ${bodySize} bytes`);
          
          // Special handling for registration
          if (req.path.includes('/api/register')) {
            console.log('[Proxy] Registration request detected');
            
            // Don't log passwords, but log other fields for debugging
            const sanitizedBody = { ...req.body };
            if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
            console.log('[Proxy] Registration data:', sanitizedBody);
            
            // Make sure content type is set correctly
            proxyReq.setHeader('Content-Type', 'application/json');
          }
        } else {
          console.log('[Proxy] POST request has no body');
        }
      }
      
      // Extract and forward the auth token if present
      const token = req.headers.authorization;
      if (token) {
        proxyReq.setHeader('Authorization', token);
        console.log('[Proxy] Forwarding authorization token');
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      // Log incoming proxy responses
      console.log(`[Proxy] Response: ${proxyRes.statusCode} for ${req.method} ${req.path}`);
      
      // Special handling for authentication related endpoints
      if (req.path.includes('/api/login') || req.path.includes('/api/register')) {
        console.log('[Proxy] Auth-related endpoint response received');
        
        // Log response headers for debugging
        console.log('[Proxy] Response headers:', proxyRes.headers);
        
        // For error responses, try to capture more details
        if (proxyRes.statusCode >= 400) {
          let responseBody = '';
          
          proxyRes.on('data', (chunk) => {
            responseBody += chunk;
          });
          
          proxyRes.on('end', () => {
            try {
              const parsedBody = JSON.parse(responseBody);
              console.log('[Proxy] Error response body:', parsedBody);
            } catch (e) {
              console.log('[Proxy] Error response body (raw):', responseBody);
            }
          });
        }
      }
    },
    onError: (err, req, res) => {
      // Log proxy errors
      console.error('[Proxy Error]', err);
      
      // Send a proper error response to client
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        const json = { error: 'Proxy Error', message: err.message };
        res.end(JSON.stringify(json));
      }
    }
  });
  
  // Apply the proxy middleware to all /api routes
  app.use('/api', apiProxy);
  
  // Special handling for authentication POST endpoints
  app.use(['/api/login', '/api/register', '/api/verify-token'], (req, res, next) => {
    console.log(`[Auth Proxy] ${req.method} ${req.path}`);
    if (req.method === 'POST') {
      console.log('[Auth Proxy] Forwarding auth request');
    }
    return apiProxy(req, res, next);
  });
};