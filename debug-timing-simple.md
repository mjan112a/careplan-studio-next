# Simple Timing Debug Analysis

## The Problem
- **Policy Details**: Year 1 = $100k premium, Years 2+ = $0 premium
- **Income Chart**: Shows premiums in years 2-6 instead of year 1

## Likely Causes

### 1. Off-by-One Error in Policy Year Calculation
```typescript
// Current logic in calculation-utils.ts line 201
const policyYear = yearsSinceStart + 1 // Policy year starts at 1

// If yearsSinceStart = 0 (age 60), policyYear = 1 ✓ CORRECT
// If yearsSinceStart = 1 (age 61), policyYear = 2 ✓ CORRECT
```

### 2. Policy Data Indexing Issue
The policy data might be indexed differently than expected:
- **Expected**: policy.year = 1, 2, 3, ...
- **Actual**: policy.year = 0, 1, 2, ... (zero-indexed)

### 3. Interpolation Logic Issue
The `findPolicyDataForYear` function might be returning wrong years due to interpolation.

## Quick Fix Options

### Option A: Adjust Policy Year Mapping
```typescript
// Try this adjustment:
const policyYear = yearsSinceStart // Start from 0 instead of 1
```

### Option B: Debug the Policy Data Structure
Check if the policy data is zero-indexed or one-indexed.

### Option C: Check Chart Timing
The chart might be using different age indexing than the calculation.

## Manual Test
1. Enable policy
2. Check console for "DEBUG PREMIUM" messages
3. Compare Age vs PolicyYear vs Premium values
4. Identify the offset pattern