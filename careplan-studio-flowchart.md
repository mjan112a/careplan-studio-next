# Care Plan Studio Financial Simulator - Application Flowchart

## Overview
This is a comprehensive financial planning and Long-Term Care (LTC) insurance simulation webapp that projects financial scenarios for individuals or couples over their lifetime.

## High-Level Application Architecture

```mermaid
graph TB
    A[User Loads App] --> B[Initialize Policy Provider]
    B --> C[Load Default/Custom Policy Data]
    C --> D[Initialize Person 1 & Person 2]
    D --> E[Financial Simulator Component]
    
    E --> F{User Selects View}
    F -->|Person 1| G[Person 1 Calculations]
    F -->|Person 2| H[Person 2 Calculations]
    F -->|Combined| I[Combined Household View]
    
    G --> J[Display Charts & Results]
    H --> J
    I --> J
    
    J --> K{User Makes Changes?}
    K -->|Yes| L[Update Parameters]
    K -->|No| M[Generate Reports]
    
    L --> N[Recalculate Scenarios]
    N --> J
    
    M --> O[Export/Share Results]
```

## Core Financial Calculation Flow

```mermaid
graph TD
    A[Start Calculation for Person] --> B[Initialize Variables]
    B --> C[Loop: Age = Current Age to 95]
    
    C --> D{Is Retired?}
    D -->|No| E[Calculate Work Income with Raises]
    D -->|Yes| F[Calculate Retirement Income Needs]
    
    E --> G[Calculate 401k Growth + Contributions]
    F --> H[Calculate Social Security & Pension]
    
    G --> I{Has LTC Event This Year?}
    H --> I
    
    I -->|No| J[No LTC Costs or Benefits]
    I -->|Yes| K[Calculate LTC Costs & Policy Benefits]
    
    J --> L[Calculate Income Gap]
    K --> L
    
    L --> M{Policy Enabled?}
    M -->|Yes| N[Deduct Policy Premiums]
    M -->|No| O[No Policy Premiums]
    
    N --> P[Calculate Assets With Policy]
    O --> Q[Calculate Assets Without Policy]
    
    P --> R{Assets <= 0?}
    Q --> R
    
    R -->|Yes| S[Mark Bankruptcy]
    R -->|No| T[Continue Normal Operations]
    
    S --> U[Set Assets to 0]
    T --> V[Calculate Net Worth]
    U --> V
    
    V --> W{Is Death Year?}
    W -->|Yes| X[Record Death Benefits]
    W -->|No| Y[Continue to Next Year]
    
    X --> Y
    Y --> Z{Age < 95?}
    Z -->|Yes| C
    Z -->|No| AA[Calculate Summary Metrics]
    
    AA --> BB[Return Complete Person Data]
```

## Policy Data Integration Flow

```mermaid
graph LR
    A[Policy Data Source] --> B{Data Type?}
    B -->|Default| C[Built-in Sample Data]
    B -->|Custom Upload| D[User Uploaded Files]
    
    C --> E[Policy Provider Context]
    D --> F[Parse & Validate Upload]
    F --> E
    
    E --> G[Find Policy Data for Year]
    G --> H{Exact Year Match?}
    H -->|Yes| I[Use Exact Data]
    H -->|No| J[Interpolate Between Years]
    
    I --> K[Apply to Calculations]
    J --> K
    
    K --> L{Policy Enabled?}
    L -->|Yes| M[Calculate Premiums & Benefits]
    L -->|No| N[Skip Policy Calculations]
    
    M --> O[LTC Benefits During Events]
    N --> P[No Policy Benefits]
    O --> Q[Update Financial Projections]
    P --> Q
```

## Component Architecture & Data Flow

```mermaid
graph TB
    A[FinancialSimulatorWrapper] --> B[PolicyProvider Context]
    B --> C[FinancialSimulator Main Component]
    
    C --> D[State Management]
    D --> E[person1Inputs & person1Results]
    D --> F[person2Inputs & person2Results]
    D --> G[combinedData]
    
    C --> H[Input Components]
    H --> I[PersonForm - Demographics & Financial Params]
    H --> J[KeySliders - Quick Adjustments]
    H --> K[PolicyDataUploader - Custom Policy Data]
    
    C --> L[Calculation Engine]
    L --> M[calculateRetirementScenario]
    L --> N[combineRetirementData]
    
    C --> O[Visualization Components]
    O --> P[IncomeChart - Income Sources & Gaps]
    O --> Q[AssetChart - Asset Projections]
    O --> R[LtcChart - LTC Event Impact]
    O --> S[SummaryCard - Key Metrics]
    
    E --> M
    F --> M
    M --> E
    M --> F
    E --> N
    F --> N
    N --> G
    
    E --> O
    F --> O
    G --> O
```

## Financial Calculation Details

### Income Calculation Logic
```mermaid
graph TD
    A[Start Year Calculation] --> B{Working or Retired?}
    B -->|Working| C[Annual Income × (1 + PayRaise%)^Years]
    B -->|Retired| D[Calculate Retirement Income Need]
    
    D --> E[Final Working Income × Income Replacement %]
    E --> F[Inflate for General Inflation Since Retirement]
    
    C --> G[Add to Assets: Income + 401k Growth + Contributions]
    F --> H[Calculate Income Sources]
    
    H --> I[Social Security + Pension + Policy Income]
    I --> J[Income Gap = Income Needed - Income Sources]
    
    G --> K[Subtract: Policy Premiums if Enabled]
    J --> L[Withdraw Income Gap from 401k]
    
    K --> M[Asset Balance for Next Year]
    L --> M
```

### LTC Event Handling
```mermaid
graph TD
    A[Check LTC Event Status] --> B{LTC Enabled & In Event Period?}
    B -->|No| C[No LTC Costs or Benefits]
    B -->|Yes| D[Calculate Inflated LTC Costs]
    
    D --> E[Monthly Need × 12 × LTC Inflation Factor]
    E --> F{Policy Enabled?}
    
    F -->|No| G[Full Out-of-Pocket LTC Costs]
    F -->|Yes| H[Calculate Policy Benefits]
    
    H --> I[Use COB Monthly Benefit from Policy Data]
    I --> J[Policy Benefits = Min(Monthly Benefit × 12, LTC Costs)]
    J --> K[Out-of-Pocket = LTC Costs - Policy Benefits]
    
    G --> L[Add to Income Needed]
    K --> L
    
    L --> M[Include in Total Income Gap Calculation]
```

## Key Features & Scenarios

### Scenario Comparison
- **With Policy**: Pays premiums, receives LTC benefits, has cash value growth
- **Without Policy**: No premiums, no benefits, more available for 401k growth
- **Bankruptcy Detection**: When assets hit zero during retirement
- **Legacy Planning**: Death benefits and remaining assets

### Data Visualization
- **Income Charts**: Work income, Social Security, pension, policy income, income gaps
- **Asset Charts**: 401k growth with/without policy, policy cash values
- **LTC Charts**: Costs, benefits, out-of-pocket expenses during events
- **Combined Views**: Household-level projections and summaries

### User Interactions
1. **Parameter Adjustments**: Age, income, retirement age, LTC settings
2. **Policy Toggles**: Enable/disable policies, switch between data sets
3. **Scenario Analysis**: Compare outcomes with different assumptions
4. **Report Generation**: Export findings for client presentations

## Technical Implementation Notes

### State Management
- **Input State**: User-modifiable parameters
- **Results State**: Calculated projections (read-only)
- **Immediate Recalculation**: Changes trigger instant updates
- **Policy Context**: Manages default vs. custom policy data

### Performance Optimizations
- **Memoized Calculations**: Avoid unnecessary recalculations
- **Debounced Updates**: Prevent excessive calculations during user input
- **Incremental Updates**: Only recalculate affected scenarios

### Error Handling
- **Bankruptcy Scenarios**: Graceful handling when assets are depleted
- **Data Validation**: Ensure realistic parameter ranges
- **Policy Data Fallbacks**: Handle missing or invalid policy years

This flowchart represents the complete logic flow of the financial planning simulator, showing how user inputs flow through calculations to generate comprehensive retirement and LTC planning scenarios.