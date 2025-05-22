# Policy Data Mapping Documentation

## Overview

This document describes the policy data mapping system used by the simulator to handle both sample data and database-sourced policy data.

## Problem Statement

The simulator requires policy data in a specific format defined in `types/simulator-interfaces.ts`. However, processed data from the database may:

1. Have a different structure than what the simulator expects
2. Be incomplete, missing certain required fields
3. Evolve over time as the database schema changes

## Solution: Flexible Mapping System

We've implemented a flexible mapping system in `lib/policy-data/index.ts` that can:

1. Transform database data into the expected format
2. Fill in missing fields with reasonable defaults
3. "Embellish" sparse data by combining it with sample data
4. Gracefully handle unexpected data formats

## Component Integration

To ensure all components use the correctly mapped policy data, we've updated the following components:

1. **PolicyDataDebug**: Now uses `usePolicyData()` hook instead of directly loading sample data
2. **AIAnalysis**: Uses the mapped policy data with embellishment enabled
3. **InitialAssetCalculation**: Uses the mapped policy data with a fallback to sample data
4. **PolicyGrowthChart**: Uses an updated `getPolicyDataForPerson()` function that checks for window global data

The `getPolicyDataForPerson()` function now checks for data in this order:

1. `window._customPolicyData` (mapped data from API)
2. Sample data as a fallback

This ensures consistent data flow across the entire simulator.

## How It Works

### 1. Data Flow

```
URL Query String (doc_ids) → fetchPolicyData → mapProcessedDataToPolicyData → Simulator
```

If no doc_ids are present in the URL, sample data is used.

### 2. Mapping Function

The `mapProcessedDataToPolicyData` function:

- Determines if data is already in the correct format
- Handles array-format processed data (common from database extractions)
- Handles Gemini API response format (JSON text inside candidate response)
- Extracts basic information from first-year data
- Creates policy level information with defaults or provided values
- Maps each year's data to the expected annual policy data format
- Fills in missing values with either defaults or sample data values
- Returns properly formatted PolicyData object

### 3. Embellishment Feature

The `useEmbellishment` parameter controls whether to:

- Just map the data with minimal defaults (false)
- Fill in missing fields with corresponding values from sample data (true)

A UI toggle appears automatically when incomplete policy data is detected, allowing users to switch between these modes.

## Implementation Details

### Mapping Strategies

1. **Direct Mapping**: When fields match 1:1 between source and target schema
2. **Transformation**: When calculations are needed (e.g., `monthly_benefit_limit = death_benefit * 0.04 / 12`)
3. **Default Values**: When data is missing (e.g., `acceleration_percentage = 100`)
4. **Sample Data Layering**: Using sample data values for corresponding fields when embellishment is enabled

### Handling Missing Data

The mapping provides reasonable defaults for all required fields:

- Missing names → "Person 1", "Person 2"
- Missing gender → "Male" for first person, "Female" for second
- Missing acceleration percentage → 100
- Missing monthly payout percentage → 4
- Missing monthly benefit limit → Calculated as 4% of death benefit / 12

### Edge Cases

1. **No Processed Data**: Falls back to sample data
2. **Unexpected Format**: Logs a warning and falls back to sample data
3. **Error During Mapping**: Catches errors, logs them, and falls back to sample data
4. **Partial Policy Data**: Maps available fields and fills in the rest

## Usage

### Basic Usage

```typescript
// In a component that needs policy data
const { policyData, loading } = usePolicyData();
```

### With Embellishment

```typescript
// Enable embellishment to fill in missing fields with sample data
const { policyData, loading } = usePolicyData(true);
```

### UI Toggle

The simulator automatically shows a toggle for the embellishment feature when incomplete policy data is detected:

```tsx
{policyData && policyData.some(policy => policy._incomplete) && (
  <div className="flex items-center space-x-2">
    <Switch id="useEmbellishment" checked={useEmbellishment} onCheckedChange={setUseEmbellishment} />
    <Label htmlFor="useEmbellishment">Enhance Policy Data</Label>
  </div>
)}
```

## Maintenance

When the database schema changes:

1. Update the `mapProcessedDataToPolicyData` function to handle the new schema
2. Add any new fields to the mapping logic
3. Update default values as needed

## Flag for Incomplete Data

Mapped data includes an `_incomplete` flag to indicate it was auto-mapped from incomplete data:

```typescript
return {
  policy_level_information: policyLevelInformation,
  annual_policy_data: annualPolicyData,
  _incomplete: true // Flag to indicate this data was auto-mapped
};
```

This flag is used to conditionally show the embellishment toggle in the UI.
