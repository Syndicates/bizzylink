# Code Formatting Corruption Prevention Guide

## ⚠️ The Problem We Just Experienced

During our Profile.js refactoring, we encountered **repeated code formatting corruption** where:
- JSX became compressed into single lines
- Hook destructuring became malformed
- Import statements got corrupted
- Valid code became unparseable

**This exact issue happened multiple times in our conversation**, proving how easy it is to trigger.

## 🔍 Root Causes Identified

1. **Large search/replace operations** on complex JSX structures
2. **Files over 20-25KB** being edited with automated tools
3. **Multiple consecutive edits** without validation
4. **Complex comment blocks** interfering with parsing
5. **Mixed editing approaches** (search_replace + edit_file)

## 🛡️ Prevention Strategies

### 1. File Size Rule
```bash
# Before any major edit, check file size
ls -lh Profile.js
# If > 25KB, break into smaller pieces FIRST
```

### 2. Editing Tool Selection
- **Small edits (< 50 lines)**: Use `search_replace`
- **Large sections**: Use `edit_file` 
- **Entire files**: Delete and recreate
- **JSX-heavy areas**: Use `edit_file` exclusively

### 3. Incremental Validation
```bash
# After EVERY edit
node -c filename.js  # Check syntax
npm run build       # Verify compilation
```

### 4. Safe Patterns

**✅ SAFE**:
```javascript
// Small, focused changes
const handleClick = () => console.log('old');
// Replace with:
const handleClick = useCallback(() => console.log('new'), []);
```

**❌ DANGEROUS**:
```javascript
// Large JSX blocks with complex nesting
<div>
  <Component1>
    <NestedComponent>
      {/* 50+ lines of complex JSX */}
    </NestedComponent>
  </Component1>
</div>
```

## 🚨 Emergency Recovery Protocol

### When Corruption Occurs:

1. **STOP IMMEDIATELY** - don't make more edits
2. **Save corrupted version** for reference
3. **Restore from git** or backup:
   ```bash
   git checkout -- filename.js
   ```
4. **Manually reconstruct** using working pieces
5. **Test thoroughly** before continuing

### Red Flags to Watch For:
- Code suddenly becomes single-line
- Syntax highlighter shows errors
- Import statements look compressed
- JSX nesting becomes flat

## 🎯 Specific Recommendations

### For Profile.js Refactoring:
1. **Break into hooks first** (useProfileData, useWallPosts)
2. **Extract components one by one** 
3. **Test after each extraction**
4. **Use git commits as checkpoints**

### For Large File Editing:
1. **Create backup before starting**
2. **Work in small 20-50 line chunks**
3. **Validate syntax after each change**
4. **Use IDE formatting tools regularly**

## 📋 Checklist for Safe Refactoring

### Pre-Edit:
- [ ] File size < 25KB or plan to break up
- [ ] Git committed and clean working directory
- [ ] Backup created if needed
- [ ] ESLint/Prettier configured

### During Edit:
- [ ] Edit small sections (< 50 lines)
- [ ] Check syntax after each change
- [ ] Use appropriate tool (search_replace vs edit_file)
- [ ] Avoid editing near complex comment blocks

### Post-Edit:
- [ ] Syntax check passes
- [ ] Build completes successfully  
- [ ] Functionality works as expected
- [ ] Code formatting looks correct

## 🔧 Tools and Settings

### Recommended VS Code Settings:
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.autoSave": "onFocusChange",
  "editor.rulers": [80, 120],
  "editor.wordWrap": "on"
}
```

### ESLint Rules for Safety:
```json
{
  "rules": {
    "max-lines": ["warn", 500],
    "max-lines-per-function": ["warn", 100],
    "complexity": ["warn", 15],
    "max-len": ["warn", { "code": 120 }]
  }
}
```

## 📊 What We Learned

1. **Large files are inherently risky** to edit with automated tools
2. **JSX is particularly fragile** during automated edits
3. **Multiple tools can conflict** and cause corruption
4. **Validation after every edit** is essential
5. **Breaking files into pieces FIRST** is safer than editing large monoliths

## 🎪 The Irony

This guide itself demonstrates the problem - we had to create a NEW file because trying to edit the existing REFACTORING_GUIDE.md kept causing the same corruption issues we're trying to prevent!

---

**Remember**: When in doubt, create a new file rather than risk corrupting working code. 