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