const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  console.log('Proxy setup is running!');
  
  // Setup proxy middleware
  const apiProxy = createProxyMiddleware({
    target: 'http://localhost:8080',
    changeOrigin: true,
    secure: false,
    logLevel: 'debug',
    onProxyReq: (proxyReq, req) => {
      console.log(`Proxying ${req.method} request to: ${req.url}`);
    }
  });

  // Apply proxy ONLY to API routes and auth endpoints
  // Do NOT proxy frontend routes that should be handled by React Router
  app.use('/api', apiProxy);
  
  // Only proxy POST requests for auth endpoints
  app.use((req, res, next) => {
    if (req.method === 'POST' && ['/login', '/register', '/logout', '/verify'].includes(req.path)) {
      return apiProxy(req, res, next);
    }
    next();
  });
};