# BizzyLink Development Rules & Best Practices

## Core Development Principles

### 1. No Mock Data in Production
- **✅ DO:** Use real data from APIs and databases
- **❌ DON'T:** Include placeholder or mock data in production code
- **WHY:** Mock data creates misleading user experiences and becomes technical debt

### 2. Proper Issue Analysis
- **✅ DO:** Trace issues to their root cause before implementing fixes
- **❌ DON'T:** Apply quick patches that mask symptoms without addressing causes
- **WHY:** Superficial fixes accumulate and create more complex issues over time

### 3. API & Data Management
- **✅ DO:** Implement proper caching strategies and debouncing of requests
- **✅ DO:** Use intelligent data fetching with timestamps for "stale" detection
- **❌ DON'T:** Poll APIs repeatedly without valid reason
- **WHY:** Unnecessary requests waste resources and create poor UX

### 4. Performance Optimization
- **✅ DO:** Implement memoization (useCallback, useMemo) for expensive operations
- **✅ DO:** Set proper dependencies in useEffect hooks to prevent infinite loops
- **✅ DO:** Optimize renders with React.memo and shouldComponentUpdate
- **❌ DON'T:** Render components unnecessarily or cause layout thrashing
- **WHY:** Performance issues scale exponentially with user base

### 5. Error Handling
- **✅ DO:** Implement comprehensive error states for all API calls
- **✅ DO:** Provide fallbacks that don't crash the application or block UX
- **❌ DON'T:** Silently fail or display cryptic error messages
- **WHY:** Proper error handling improves user trust and aids debugging

### 6. Component Design
- **✅ DO:** Follow single responsibility principle
- **✅ DO:** Keep components small and focused
- **✅ DO:** Use composability over inheritance
- **❌ DON'T:** Create monolithic components with multiple responsibilities
- **WHY:** Maintainable code is modular and focused

### 7. Data Loading States
- **✅ DO:** Display loading indicators while fetching data
- **✅ DO:** Preserve previous data during refreshes to avoid flickering
- **✅ DO:** Implement skeleton screens for initial loads
- **❌ DON'T:** Show empty screens or flash content during loading
- **WHY:** Proper loading states provide better user experience

### 8. Test Coverage
- **✅ DO:** Write unit tests for core logic and critical paths
- **✅ DO:** Implement integration tests for component interactions
- **✅ DO:** Test error states and edge cases
- **❌ DON'T:** Skip testing due to time constraints
- **WHY:** Tests catch regressions and document expected behavior

### 9. Code Review Standards
- **✅ DO:** Review all code changes before merging
- **✅ DO:** Focus on logic, performance, and security
- **✅ DO:** Document complex implementations
- **❌ DON'T:** Allow workarounds or TODO comments without tickets
- **WHY:** Code reviews maintain quality and share knowledge

### 10. Technical Debt Management
- **✅ DO:** Refactor code regularly as part of feature work
- **✅ DO:** Address performance issues proactively
- **✅ DO:** Update dependencies and address security vulnerabilities promptly
- **❌ DON'T:** Accumulate temporary fixes and workarounds
- **WHY:** Managing technical debt prevents catastrophic failures

## Problem-Solving Methodology

1. **Identify the problem**
   - Gather concrete evidence through logs, errors, and user reports
   - Reproduce the issue consistently
   - Document the conditions that trigger the issue

2. **Analyze the root cause**
   - Trace the flow through the codebase
   - Use debugging tools to identify the actual problem point
   - Create a hypothesis that fully explains the observed behavior

3. **Design a solution**
   - Create a plan that addresses the root cause, not just symptoms
   - Consider potential side effects and edge cases
   - Discuss solutions with the team for additional perspectives

4. **Implement**
   - Create clean, readable code that follows project standards
   - Add appropriate comments for complex logic
   - Include error handling for exceptional cases

5. **Verify**
   - Test the solution under various conditions
   - Validate that the original issue is resolved
   - Check that no new issues were introduced

6. **Document**
   - Update related documentation
   - Add comments to explain "why" not just "what"
   - Share learnings with the team

## Common Antipatterns to Avoid

1. **Premature optimization**
   - Fix real performance issues, not theoretical ones
   - Profile before optimizing

2. **Cargo cult programming**
   - Understand why a solution works, don't just copy patterns
   - Question practices that don't have clear benefits

3. **Overengineering**
   - Keep solutions as simple as possible while meeting requirements
   - Don't add complexity for future needs that may never materialize

4. **Analysis paralysis**
   - Set time limits for research and decision-making
   - Be willing to adapt as you learn more

5. **Not Invented Here syndrome**
   - Use established libraries for common problems
   - Focus development time on unique value-add for your application

## Git Workflow & Best Practices

### 1. Branch Management
- **✅ DO:** Create feature branches for all new work (`feature/feature-name`)
- **✅ DO:** Keep `main` branch always deployable
- **✅ DO:** Use `Version2` for active development and `original_build` as historical reference
- **❌ DON'T:** Commit directly to protected branches (main, Version2)
- **WHY:** Clean branch structure enables parallel work and clear release management

### 2. Commit Practices
- **✅ DO:** Commit small, logical chunks of work
- **✅ DO:** Write descriptive commit messages (use present tense: "Add feature" not "Added feature")
- **✅ DO:** Include ticket/issue numbers in commit messages when applicable
- **❌ DON'T:** Commit broken code or incomplete features to shared branches
- **WHY:** Clear commit history improves debugging and knowledge sharing

### 3. Pull Request & Code Review
- **✅ DO:** Create pull requests with clear descriptions of changes
- **✅ DO:** Ensure CI tests pass before merging
- **✅ DO:** Address all review comments before merging
- **❌ DON'T:** Merge your own pull requests without review
- **WHY:** Peer review improves code quality and knowledge sharing

### 4. When to Commit
- **✅ DO:** Commit after implementing a complete feature or logical portion
- **✅ DO:** Commit after fixing bugs or performance issues
- **✅ DO:** Commit after refactoring code sections
- **✅ DO:** Run tests before committing to ensure functionality
- **❌ DON'T:** Wait too long between commits (risk of losing work)
- **WHY:** Regular commits provide checkpoint recovery and clearer history

### 5. Git Hygiene
- **✅ DO:** Keep .gitignore updated to exclude unnecessary files
- **✅ DO:** Regularly pull changes from main branches to avoid large merge conflicts
- **✅ DO:** Use `git rebase` to maintain a clean commit history when appropriate
- **❌ DON'T:** Commit credentials, API keys, or sensitive configuration
- **WHY:** Clean repositories improve performance and security

## Code Comments & Documentation Best Practices

### 1. When to Comment
- **✅ DO:** Comment complex algorithms and business logic
- **✅ DO:** Add context for workarounds and unusual approaches
- **✅ DO:** Document function parameters, return values, and exceptions
- **❌ DON'T:** Comment obvious code (e.g., `// increment counter`)
- **WHY:** Comments should explain "why" not "what" when the code is unclear

### 2. Comment Structure
- **✅ DO:** Begin with a clear summary of what the code accomplishes
- **✅ DO:** Include examples for non-trivial usage
- **✅ DO:** Structure JSDoc/similar comments with tags for parameters, returns, etc.
- **❌ DON'T:** Write long, unstructured paragraphs
- **WHY:** Well-structured comments are easier to read and maintain

### 3. Debugging Information
- **✅ DO:** Include details on potential edge cases and failure points
- **✅ DO:** Document assumptions the code makes about inputs/state
- **✅ DO:** Add references to relevant issue tickets or documentation
- **❌ DON'T:** Remove comments about tricky bugs once fixed
- **WHY:** Debugging comments help prevent regressions and aid troubleshooting

### 4. Comment Maintenance
- **✅ DO:** Update comments when code changes
- **✅ DO:** Remove comments that no longer apply
- **✅ DO:** Clarify any `TODO` comments with ticket numbers or specific context
- **❌ DON'T:** Leave outdated comments in the codebase
- **WHY:** Incorrect comments are worse than no comments at all

### 5. Commenting Style
- **✅ DO:** Use consistent verb tense (usually present tense)
- **✅ DO:** Write in complete sentences with proper punctuation
- **✅ DO:** Keep a professional, clear tone
- **❌ DON'T:** Include jokes, non-professional language, or blame
- **WHY:** Comments should remain professional and helpful to all team members

## Copyright & Ownership Information

### 1. Copyright Header
- **✅ DO:** Add the following header to all source code files:
  ```
  /**
   * +-------------------------------------------------+
   * |                 BIZZY NATION                    |
   * |          Crafted with ♦ by Bizzy [year]         |
   * +-------------------------------------------------+
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
- **❌ DON'T:** Omit copyright information from any source files
- **WHY:** Establishes intellectual property rights and ownership with memorable visual impact

### 2. Copyright Placement
- **✅ DO:** Place the copyright notice at the very top of each file
- **✅ DO:** Include the notice before any imports or other code statements
- **❌ DON'T:** Bury copyright notices within the middle of files
- **WHY:** Ensures visibility and immediate recognition of ownership

### 3. Copyright Maintenance
- **✅ DO:** Update the year in copyright notices during substantial file modifications
- **✅ DO:** Maintain consistent format across all files
- **❌ DON'T:** Use varying or incomplete copyright statements
- **WHY:** Consistent copyright notices strengthen legal protection

### 4. Third-Party Code
- **✅ DO:** Clearly distinguish between proprietary code and third-party components
- **✅ DO:** Respect and maintain third-party license notices when using external libraries
- **❌ DON'T:** Remove or modify external copyright notices
- **WHY:** Respects others' intellectual property while protecting our own

## Security Best Practices

### 1. Authentication & Authorization
- **✅ DO:** Implement proper authentication checks for all protected routes
- **✅ DO:** Use role-based access control with principle of least privilege
- **✅ DO:** Verify permissions on both client and server sides
- **❌ DON'T:** Rely solely on hiding UI elements for security
- **WHY:** Security by obscurity is not real security

### 2. Data Protection
- **✅ DO:** Sanitize all user inputs to prevent injection attacks
- **✅ DO:** Use parameterized queries when interacting with databases
- **✅ DO:** Encrypt sensitive data both in transit and at rest
- **❌ DON'T:** Store sensitive information (passwords, API keys) in client-side code
- **WHY:** Data breaches can have catastrophic consequences

### 3. API Security
- **✅ DO:** Implement rate limiting to prevent abuse
- **✅ DO:** Use proper HTTP status codes and error handling
- **✅ DO:** Validate all API inputs with strong type checking
- **❌ DON'T:** Expose detailed error messages to clients in production
- **WHY:** Secure APIs protect both your data and your infrastructure

### 4. Dependency Management
- **✅ DO:** Regularly audit dependencies for security vulnerabilities
- **✅ DO:** Keep dependencies updated to patched versions
- **✅ DO:** Lock dependency versions in package files
- **❌ DON'T:** Use abandoned or poorly maintained libraries for critical functionality
- **WHY:** Supply chain attacks are increasingly common

## User Authentication & Registration Best Practices

### 1. Registration Flow
- **✅ DO:** Implement email verification to confirm user identity
- **✅ DO:** Use CAPTCHA or similar mechanisms to prevent automated registrations
- **✅ DO:** Clearly communicate password requirements during registration
- **✅ DO:** Validate all user inputs with both frontend and backend checks
- **❌ DON'T:** Store unverified accounts with the same privileges as verified ones
- **WHY:** A secure registration flow prevents account fraud and protects your platform

### 2. Password Management
- **✅ DO:** Enforce strong password policies (minimum length, complexity)
- **✅ DO:** Hash passwords using strong algorithms (bcrypt, Argon2) with proper salt
- **✅ DO:** Support password managers (avoid custom security questions)
- **✅ DO:** Implement maximum failed login attempts with temporary lockouts
- **❌ DON'T:** Store plaintext passwords or use weak hashing algorithms (MD5, SHA1)
- **WHY:** Password security is the first line of defense for user accounts

### 3. Authentication Tokens
- **✅ DO:** Use short-lived JWTs or similar tokens for authentication
- **✅ DO:** Implement token refresh mechanisms for longer sessions
- **✅ DO:** Include essential claims and proper expiration times
- **✅ DO:** Store tokens securely (HttpOnly cookies for web applications)
- **❌ DON'T:** Store sensitive user data in client-accessible tokens
- **WHY:** Secure token management prevents session hijacking and related attacks

### 4. Multi-Factor Authentication
- **✅ DO:** Offer MFA as an option for all users (strongly encouraged)
- **✅ DO:** Support industry-standard TOTP (Time-based One-Time Password)
- **✅ DO:** Provide backup codes for account recovery
- **✅ DO:** Require MFA for privileged accounts (admins, moderators)
- **❌ DON'T:** Use SMS as the only MFA option due to SIM swapping vulnerabilities
- **WHY:** MFA dramatically reduces account takeover risk even if passwords are compromised

### 5. Session Management
- **✅ DO:** Regenerate session IDs after login, privilege changes, or security events
- **✅ DO:** Implement proper session timeouts for inactivity
- **✅ DO:** Provide "Remember Me" functionality with appropriate security measures
- **✅ DO:** Enable users to view and terminate active sessions
- **❌ DON'T:** Store session data solely on the client side
- **WHY:** Proper session management prevents session fixation and related attacks

### 6. Account Recovery
- **✅ DO:** Implement secure password reset mechanisms with time-limited tokens
- **✅ DO:** Send password reset links to verified email addresses only
- **✅ DO:** Log and notify users of account recovery attempts
- **✅ DO:** Require identity verification before password changes
- **❌ DON'T:** Reveal account existence through recovery processes
- **WHY:** Insecure account recovery can bypass all other security measures

### 7. Login Events & Security Notifications
- **✅ DO:** Log all authentication events securely (success, failure, lockout)
- **✅ DO:** Notify users of important security events (password change, unusual login location)
- **✅ DO:** Include relevant information in notifications (time, IP address, device)
- **✅ DO:** Provide actionable security recommendations
- **❌ DON'T:** Include sensitive information in notification emails
- **WHY:** Security awareness helps users identify and respond to account threats

## Accessibility Standards

### 1. Basic Requirements
- **✅ DO:** Ensure proper heading hierarchy (h1 → h6)
- **✅ DO:** Add descriptive alt text to all images
- **✅ DO:** Maintain sufficient color contrast (WCAG AA minimum)
- **❌ DON'T:** Rely solely on color to convey information
- **WHY:** Accessible applications serve all users, including those with disabilities

### 2. Interactive Elements
- **✅ DO:** Ensure all interactive elements are keyboard accessible
- **✅ DO:** Use appropriate ARIA roles and attributes when needed
- **✅ DO:** Implement proper focus management and visible focus states
- **❌ DON'T:** Use non-standard interaction patterns without clear instructions
- **WHY:** Proper interaction design benefits all users, not just those with accessibility needs

### 3. Forms and Validation
- **✅ DO:** Associate labels with form inputs
- **✅ DO:** Provide clear error messages for form validation
- **✅ DO:** Group related form elements with fieldsets and legends
- **❌ DON'T:** Remove browser-native focus indicators without replacement
- **WHY:** Accessible forms improve completion rates for all users

## Environment Configuration Management

### 1. Environment Variables
- **✅ DO:** Use environment variables for configuration that varies between environments
- **✅ DO:** Include a template .env.example file with all required variables
- **✅ DO:** Document the purpose of each environment variable
- **❌ DON'T:** Hardcode environment-specific values in application code
- **WHY:** Proper configuration management enables easy deployment across environments

### 2. Secrets Management
- **✅ DO:** Use a secure vault or environment variables for secrets
- **✅ DO:** Implement different credentials for different environments
- **✅ DO:** Rotate credentials regularly, especially after team member departures
- **❌ DON'T:** Store secrets in version control, even in history
- **WHY:** Exposed credentials are a primary vector for security breaches

### 3. Feature Flags
- **✅ DO:** Use feature flags for controlled feature rollouts
- **✅ DO:** Create emergency kill switches for problematic features
- **✅ DO:** Clean up unused feature flags when they're fully adopted
- **❌ DON'T:** Allow feature flag logic to become permanent technical debt
- **WHY:** Controlled rollouts reduce risk and enable easy rollbacks

## Monitoring and Observability

### 1. Logging Practices
- **✅ DO:** Implement structured logging with consistent formats
- **✅ DO:** Include context information (user ID, request ID) in logs
- **✅ DO:** Use appropriate log levels (debug, info, warn, error)
- **❌ DON'T:** Log sensitive user data or credentials
- **WHY:** Proper logging is essential for troubleshooting and auditing

### 2. Performance Monitoring
- **✅ DO:** Monitor key application metrics (response time, error rates)
- **✅ DO:** Set up alerts for critical performance thresholds
- **✅ DO:** Track both frontend and backend performance metrics
- **❌ DON'T:** Wait for user complaints to identify performance issues
- **WHY:** Proactive monitoring prevents negative user experiences

### 3. Error Tracking
- **✅ DO:** Implement global error tracking and reporting
- **✅ DO:** Capture stack traces and contextual information
- **✅ DO:** Prioritize fixing frequently occurring errors
- **❌ DON'T:** Ignore error reports or low-frequency errors
- **WHY:** Systematic error tracking improves overall application quality

## Task Management & TO_DO_LIST Maintenance

### 1. Adding New Tasks
- **✅ DO:** Add newly discovered issues to TO_DO_LIST.md immediately when found
- **✅ DO:** Include all required information (issue, impact, solution)
- **✅ DO:** Categorize tasks appropriately according to document structure
- **❌ DON'T:** Leave discovered issues undocumented or in personal notes
- **WHY:** Central task tracking ensures nothing is forgotten

### 2. Task Completion
- **✅ DO:** Remove tasks from TO_DO_LIST.md as soon as they are completed
- **✅ DO:** Document the solution in the commit message that resolves the task
- **✅ DO:** Update related documentation if the solution changes approach
- **❌ DON'T:** Leave completed tasks in the TO_DO_LIST
- **WHY:** Keeping the task list current prevents confusion about remaining work

### 3. Task Prioritization
- **✅ DO:** Address security and stability issues first
- **✅ DO:** Prioritize tasks that impact user experience
- **✅ DO:** Consider task dependencies when planning work
- **❌ DON'T:** Leave high-impact issues unaddressed for long periods
- **WHY:** Strategic prioritization maximizes development effectiveness 