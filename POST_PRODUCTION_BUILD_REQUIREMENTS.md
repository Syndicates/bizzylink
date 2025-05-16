# POST PRODUCTION BUILD REQUIREMENTS

> **This is a living document. Update it regularly as your project and requirements evolve.**

---

## 1. **Backend (Node.js/Express)**
- [ ] **Environment Variables**: All secrets (DB URI, JWT secrets, API keys) must be in environment variables, not hardcoded.
- [ ] **Process Management**: Use PM2, systemd, or Docker to keep servers running and auto-restart on crash.
- [ ] **Error Handling**: All endpoints must have robust error handling and logging.
- [ ] **Rate Limiting**: Ensure rate limiting is enabled for all sensitive endpoints (auth, registration, etc.).
- [ ] **CORS**: Restrict CORS to only allowed domains in production.
- [ ] **HTTPS**: All traffic must be served over HTTPS (use a reverse proxy like nginx or Caddy if needed).
- [ ] **API Versioning**: Implement API versioning if public APIs are exposed.
- [ ] **Input Validation**: All user input must be validated and sanitized.
- [ ] **Logging**: Use a centralized logging solution (Winston, Morgan, or external like ELK/Datadog).
- [ ] **Health Checks**: Implement `/health` or similar endpoints for uptime monitoring.
- [ ] **Static Files**: Serve static files (images, assets) from a CDN or static server, not from Node.js directly.
- [ ] **Session Security**: Secure cookies, set proper SameSite, HttpOnly, and Secure flags.
- [ ] **Dependency Updates**: Regularly update npm dependencies and audit for vulnerabilities.

## 2. **Frontend (React)**
- [ ] **Production Build**: Always deploy the optimized build (`npm run build`).
- [ ] **Static Hosting**: Serve the build with a static file server (nginx, Vercel, Netlify, S3+CloudFront, etc.).
- [ ] **Environment Variables**: Use `.env.production` for production-only variables.
- [ ] **Source Maps**: Disable or restrict source maps in production to avoid leaking code.
- [ ] **SEO & Metadata**: Ensure all pages have correct titles, meta tags, and OpenGraph data.
- [ ] **Accessibility**: Run accessibility audits (axe, Lighthouse) and fix major issues.
- [ ] **Performance**: Run Lighthouse/Pagespeed audits and optimize for load time.
- [ ] **Error Boundaries**: Use React error boundaries for graceful error handling.
- [ ] **Analytics**: Integrate analytics (Google Analytics, Plausible, etc.) as needed.
- [ ] **PWA/Offline**: If required, implement service workers and manifest for PWA support.

## 3. **Database (MongoDB)**
- [ ] **Production Cluster**: Use a managed MongoDB service (Atlas, AWS, etc.) or a dedicated, secured server.
- [ ] **Authentication**: Require strong username/password for DB access.
- [ ] **TLS/SSL**: Enforce encrypted connections to the database.
- [ ] **Backups**: Automated, regular backups with tested restore procedures.
- [ ] **Monitoring**: Enable monitoring/alerting for performance, errors, and downtime.
- [ ] **Network Security**: Restrict DB access to backend servers only (firewall, VPC, security groups).
- [ ] **Scaling**: Use replica sets for high availability; consider sharding for very large datasets.
- [ ] **Data Validation**: Use Mongoose schemas and DB-level validation.
- [ ] **Data Migration**: Have a process for schema/data migrations.

## 4. **Security**
- [ ] **Secrets Management**: Use a secrets manager or environment variables for all credentials.
- [ ] **Vulnerability Scanning**: Regularly scan for vulnerabilities (npm audit, Snyk, etc.).
- [ ] **Penetration Testing**: Schedule regular security audits and penetration tests.
- [ ] **DDoS Protection**: Use a CDN or WAF for DDoS mitigation.
- [ ] **Input Sanitization**: Prevent XSS, SQLi, and other injection attacks everywhere.
- [ ] **CSP Headers**: Set Content Security Policy headers.
- [ ] **User Permissions**: Enforce RBAC or similar for admin/moderator features.
- [ ] **Account Security**: Enforce strong passwords, 2FA (if possible), and account lockout on brute force.
- [ ] **Logging Sensitive Actions**: Log all admin actions and sensitive user events.

## 5. **Monitoring & Observability**
- [ ] **Uptime Monitoring**: Use external services (UptimeRobot, Pingdom, etc.).
- [ ] **Error Tracking**: Integrate Sentry, Rollbar, or similar for error reporting.
- [ ] **Performance Monitoring**: Use APM tools (New Relic, Datadog, etc.).
- [ ] **Log Aggregation**: Centralize logs for search and alerting.

## 6. **Deployment & DevOps**
- [ ] **CI/CD Pipeline**: Automated build, test, and deploy pipeline (GitHub Actions, GitLab CI, etc.).
- [ ] **Zero Downtime Deploys**: Use blue/green or rolling deployments if possible.
- [ ] **Rollback Plan**: Have a tested rollback procedure for failed deploys.
- [ ] **Infrastructure as Code**: Use Terraform, Ansible, or similar for repeatable infra setup.
- [ ] **Documentation**: Keep deployment, environment, and onboarding docs up to date.

## 7. **Scaling & Reliability**
- [ ] **Load Testing**: Run load tests to identify bottlenecks.
- [ ] **Horizontal Scaling**: Ensure stateless servers can be scaled out.
- [ ] **Caching**: Use Redis or similar for session/data caching.
- [ ] **Queueing**: Use a message queue (RabbitMQ, SQS, etc.) for background jobs if needed.
- [ ] **Disaster Recovery**: Document and test disaster recovery plans.

## 8. **Legal & Compliance**
- [ ] **Privacy Policy**: Publish and keep up to date.
- [ ] **Terms of Service**: Publish and keep up to date.
- [ ] **GDPR/CCPA**: Ensure compliance with relevant data protection laws.
- [ ] **Cookie Consent**: Implement cookie consent banner if required.

## 9. **Other Best Practices**
- [ ] **Regular Reviews**: Schedule regular reviews of this checklist.
- [ ] **Team Access**: Review and limit access to production systems.
- [ ] **Incident Response**: Have an incident response plan and train the team.
- [ ] **Feature Flags**: Use feature flags for risky or experimental features.
- [ ] **User Feedback**: Provide a way for users to report bugs and feedback.

---

**Update this document after every major release, incident, or infrastructure change!** 