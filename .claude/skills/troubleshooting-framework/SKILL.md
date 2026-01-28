---
name: troubleshooting-framework
version: 1.0.0
description: Systematic troubleshooting framework for development environment issues. Use when facing build failures, dependency conflicts, or environment setup problems. Prioritizes root cause analysis over symptom fixing, validates environment before proceeding, and uses decision trees to choose between fix-in-place vs start-fresh approaches. Reduces trial-and-error cycles through upfront validation and incremental verification.
---

# Troubleshooting Framework

A systematic approach to diagnosing and resolving development environment issues efficiently.

## When to Use This Skill

Use this skill when encountering:
- Build failures or compilation errors
- Dependency conflicts or version mismatches
- Environment setup issues (Node, SDK, tooling)
- Multiple cascading errors
- Repeated fix-and-fail cycles
- Uncertainty whether to fix or restart fresh

## Core Principle

**Validate before you build. Analyze before you fix. Decide before you commit.**

Avoid the reactive cycle:
❌ Try to build → Error → Fix → Build → New error → Fix → Build → ...

Instead, use the proactive cycle:
✅ Validate environment → Check compatibility → Choose strategy → Execute → Verify

## Phase 1: Environment Validation (ALWAYS FIRST)

Before attempting ANY build or install, run these checks:

### System Requirements Check
```bash
# For React Native projects
node --version              # Check Node version
npm --version               # Check npm version
java -version               # Check Java version (Android)
echo $ANDROID_HOME          # Check Android SDK path
echo $JAVA_HOME             # Check Java home
adb devices                 # Check Android tooling
npx react-native doctor     # Built-in diagnostics
```

### Version Compatibility Matrix
Check BEFORE installing:
- Framework version → Required Node version
- Build tool versions (Gradle, AGP, etc.)
- SDK versions (Android API levels)
- Native dependencies (NDK, CMake)

**Example decision tree:**
```
React Native 0.74.5 requires:
├─ Node.js: 18+
├─ Gradle: 8.3-8.8  
├─ AGP: 8.3.x
├─ Android SDK: 33-34
├─ NDK: 26.x
└─ Java: 17
```

### Red Flags to Stop and Reassess
- Multiple version mismatches detected
- CLI/doctor tools report errors
- Missing critical tools (adb, gradle, etc.)
- Extremely old versions (Node 10, etc.)

**If 3+ red flags:** Consider starting fresh rather than fixing.

## Phase 2: Root Cause vs Symptom Analysis

When errors occur, ask:

### Is This a Root Cause or Symptom?

**Symptoms (don't fix immediately):**
- "Cannot find file X" when X should be auto-generated
- Multiple import/dependency errors appearing together
- Cascading build failures across different systems

**Root Causes (fix these):**
- Wrong Node version installed
- Missing environment variables
- Incorrect build tool configuration
- Version incompatibility in package.json

### Decision Framework

**Multiple related errors?**
- STOP fixing individual errors
- Look for common root cause
- Fix root, then verify all symptoms resolve

**Single isolated error?**
- Proceed with targeted fix
- Verify fix doesn't create new issues

## Phase 3: Fix-in-Place vs Start-Fresh Decision

Use this decision tree when troubleshooting complex setup issues:

### When to Fix-in-Place
✅ Single configuration error identified
✅ Clear fix path exists
✅ Project structure is correct
✅ Versions are compatible
✅ Only 1-2 issues detected

**Time estimate:** 15-30 minutes
**Risk:** Low - changes are reversible

### When to Start Fresh
✅ 5+ cascading errors
✅ Multiple version incompatibilities
✅ Missing critical project structure
✅ Auto-generated files missing
✅ Been fixing for 30+ minutes without progress
✅ Project template was manually created (not from CLI)

**Time estimate:** 20-40 minutes initially, but higher success rate
**Risk:** Low if source code backed up

### Start-Fresh Template Approach

**Better approach for React Native (and similar frameworks):**

```bash
# 1. Create fresh project from official template
npx react-native init TempProject --version 0.74.5

# 2. Verify it builds FIRST
cd TempProject
npm run android  # Must succeed before proceeding

# 3. ONLY THEN migrate your code
cp -r ../OldProject/src TempProject/
cp ../OldProject/package.json dependencies TempProject/

# 4. Incremental validation
npm install --legacy-peer-deps
npm run android  # Verify still works

# 5. Add custom dependencies ONE AT A TIME
npm install @solana/web3.js
npm run android  # Verify after EACH addition
```

**Why this works:**
- Template has correct project structure
- Version compatibility guaranteed
- Incremental validation catches issues early
- Clear rollback points

## Phase 4: Incremental Validation Strategy

**Golden Rule: Validate after every change**

### Bad Approach (What We Did)
```
1. Install all dependencies
2. Create all config files  
3. Set up Android project
4. Add custom code
5. Fix all errors
6. Try to build → FAILS
7. Fix error 1
8. Fix error 2  
9. Fix error 3
10. Still failing...
```

### Good Approach (What We Should Have Done)
```
1. Validate Node version → VERIFY
2. Create project from template → BUILD & VERIFY
3. Add dependency 1 → BUILD & VERIFY
4. Add dependency 2 → BUILD & VERIFY
5. Migrate feature 1 → BUILD & VERIFY
6. Migrate feature 2 → BUILD & VERIFY
```

**Each step either:**
- ✅ Succeeds → Move to next step
- ❌ Fails → Fix immediately with only 1 variable changed

### Validation Checkpoints

After each major change:
```bash
# Quick validation (30s)
npm run lint        # Syntax errors
tsc --noEmit        # Type errors

# Medium validation (2-3 min)
npm run build       # Build succeeds

# Full validation (5+ min)  
npm run android     # Full build & run
```

**Don't accumulate problems.** Fix immediately when validation fails.

## Phase 5: Error Pattern Recognition

### Common Error Patterns & Real Root Causes

| Error Message | Likely Root Cause | Quick Fix |
|--------------|-------------------|-----------|
| "Command not found: X" | PATH not set or tool not installed | Check $PATH, install tool |
| "EMFILE: too many open files" | File watch limit too low | ulimit -n 65536 |
| "Unsupported engine" | Wrong Node version | nvm use [correct version] |
| "Cannot find module X" | Missing dependency or wrong cwd | npm install, check directory |
| "Module parse failed" | Wrong build tool version | Check Gradle/Webpack/etc version |
| "peer dependency" conflicts | Version incompatibility | Use --legacy-peer-deps or fix versions |
| Multiple "Cannot find file" errors | Auto-generation failed | Check build config, missing plugin |

### Cascading Error Detection

**If you see 3+ errors from different systems:**
```
Error in: Java compile
Error in: Native build  
Error in: Dependency resolution
```

**STOP.** This indicates a root configuration issue, not 3 separate problems.

**Check:**
1. Are build tool versions compatible?
2. Is project structure correct?
3. Are environment variables set?
4. Did auto-generation steps run?

## Phase 6: Time-Boxing & Escalation

### Set Time Limits

**For each troubleshooting phase:**
- Initial fix attempt: 15 minutes
- Research & retry: 15 minutes  
- Alternative approach: 15 minutes
- **Total: 45 minutes before escalating**

### Escalation Triggers

After 45 minutes without progress, choose:

**Option A: Fresh Start**
- Create new project from template
- Migrate code incrementally
- Higher success rate

**Option B: Expert Help**
- Post to Stack Overflow with full context
- Check framework GitHub issues
- Consult documentation

**Option C: Simplify Scope**
- Remove complex dependencies
- Test with minimal example
- Add complexity back gradually

### Anti-Patterns to Avoid

❌ **The Hope Cycle**
"Maybe this will work..." → Fails → "Maybe this other thing..." → Repeat

❌ **The Accumulator**  
Trying to fix 5 problems simultaneously without validation

❌ **The Version Gambler**
Randomly trying different version combinations

❌ **The Symptom Chaser**
Fixing every error message without understanding root cause

✅ **Instead: Systematic Diagnosis**
1. Understand the system
2. Validate environment
3. Isolate the variable
4. Fix root cause
5. Verify fix

## Session Retrospective Checklist

After resolving (or not resolving) an issue, ask:

### Efficiency Analysis
- [ ] Could we have detected this in Phase 1 (environment validation)?
- [ ] Did we spend >30 minutes fixing symptoms vs root cause?
- [ ] Would fresh-start have been faster?
- [ ] Did we validate incrementally or accumulate problems?
- [ ] Did we use available diagnostic tools (doctor, lint, etc.)?

### Prevention
- [ ] What check could prevent this in future?
- [ ] Should we add this to environment validation?
- [ ] Is there a better default approach?
- [ ] Can we create a template/script for this?

## Quick Reference: Decision Flowchart

```
Issue Encountered
       ↓
Has environment validation been run?
  No → Run Phase 1
  Yes ↓
       ↓
Is this a single isolated error?  
  Yes → Fix targeted issue
  No  ↓
       ↓
Are there 3+ related errors?
  Yes → Look for root cause
  No  ↓
       ↓
Has 30+ minutes been spent?
  Yes → Consider fresh start
  No  ↓
       ↓  
Fix issue → Validate immediately
       ↓
Fixed? Yes → Continue
       No → Escalate or restart
```

## Examples: Our Session Analysis

### What Happened
1. Started with incomplete project structure (no template)
2. Encountered cascading errors (Node version, Gradle version, missing files)
3. Fixed symptoms reactively (15+ individual fixes)
4. Each build took 3-5 minutes, did 8+ builds
5. **Total time: 2+ hours**

### What Should Have Happened  

**Better Approach:**
```
1. Environment validation (5 min)
   - Detected: Node 10 (too old)
   - Detected: No template-generated files
   
2. Decision: Fresh start recommended
   
3. Create from template (10 min)
   npx react-native init SplitSOL --version 0.74.5
   
4. Verify baseline (5 min)
   npm run android → SUCCESS
   
5. Migrate source code (10 min)
   cp -r old/src new/src
   
6. Add Solana deps incrementally (20 min)
   npm install @solana/web3.js
   npm run android → SUCCESS
   
   npm install react-native-get-random-values
   npm run android → SUCCESS
   
7. Total time: 50 minutes
```

### Key Learnings

**Red flags we should have caught:**
- ❌ No package.json name/version initially
- ❌ No React/React Native in dependencies  
- ❌ No template-generated config files
- ❌ Node version 10 (extremely old)
- ❌ Multiple version incompatibilities

**Better decision point:**
After 3rd error, should have chosen fresh-start approach.

## Integration with Other Skills

**Combine with:**
- `codebase-index` - Understand project structure before troubleshooting
- `problem-mapping` - Frame the problem before diving into fixes
- Built-in tools - `npx react-native doctor`, `npm run lint`, etc.

## Tool-Specific Guidance

### React Native Projects
1. ALWAYS start with: `npx react-native doctor`
2. Use template: `npx react-native init` not manual setup
3. Validate after each dependency
4. Check version compatibility at: https://reactnative.dev/

### Node.js Projects  
1. Check `.nvmrc` or `.node-version` first
2. Use `nvm use` before any commands
3. Delete `node_modules` + `package-lock.json` when in doubt
4. Fresh install > trying to fix corrupted install

### Android Projects
1. Verify SDK location: `echo $ANDROID_HOME`
2. Check adb works: `adb devices`
3. Gradle version ↔ AGP version must match
4. Clean build when changing versions: `./gradlew clean`

---

## Remember

**Time spent on upfront validation is ALWAYS recovered in faster resolution.**

15 minutes validating environment → Saves hours of trial-and-error

**When in doubt:**
1. Validate environment first
2. Start fresh if >3 incompatibilities
3. Validate after every change
4. Time-box to 45 minutes
5. Fresh start beats endless fixing
