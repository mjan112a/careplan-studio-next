export interface PolicyData {
  year: number
  premium: number
  cashValue: number
  deathBenefit: number
  totalLTCBenefit: number
  aobMonthly: number
  cobMonthly: number
}

export interface Person {
  // Identity
  id: string
  name: string
  policyData: PolicyData[]
  enabled: boolean
  active: boolean

  // Financial Parameters
  annualIncome: number
  payRaise: number
  retirementAge: number
  incomeReplacement: number
  fourOhOneKBalance: number
  annualContribution: number
  expectedSocialSecurity: number
  expectedPension: number

  // LTC Event Parameters
  ltcEventEnabled: boolean
  ltcEventAge: number
  ltcMonthlyNeed: number
  ltcDuration: number
  currentAge: number

  // Death Parameters
  deathAge: number // New parameter for death age

  // Policy Parameters
  policyEnabled: boolean
  isPremiumSingle: boolean
  annualPremiumAmount: number
  premiumYears: number

  // Economic Assumptions
  assetReturnRate: number
  retirementReturnRate: number
  generalInflationRate: number
  ltcInflationRate: number

  // Calculated Results
  retirementData: YearlyData[]
  incomeGap: number
  ltcGap: number
  totalAssets: number
  totalLtcNeeded: number
  totalLtcCovered: number
  bankrupt?: boolean
  bankruptAge?: number
  legacyAmount?: number // New calculated field for legacy amount
}

export interface YearlyData {
  age: number
  year: number
  workIncome: number
  socialSecurity: number
  pension: number
  policyIncome: number // New income source from LTC policy
  incomeNeeded: number
  incomeGap: number
  assets401k: number
  assets401kNoPolicyScenario: number
  policyPremium: number
  policyCashValue: number
  policyDeathBenefit: number
  ltcCosts: number
  ltcBenefits: number
  ltcOutOfPocket: number
  netWorth: number
  netWorthNoPolicyScenario: number
  bankrupt?: boolean
  bankruptAge?: number
  isDeathYear?: boolean // Flag to indicate if this is the year of death
}

export interface CombinedYearlyData {
  age: number
  year: number
  yearsFromNow: number // Added for easier reference
  [key: string]: number | boolean
}

// New interface for the structured data matrix
export interface DataMatrix {
  yearsFromNow: number[]
  ages: {
    person1: number[]
    person2: number[]
  }
  baseData: {
    person1: {
      workIncome: number[]
      socialSecurity: number[]
      pension: number[]
      policyIncome: number[]
      incomeNeeded: number[]
      assets401k: number[]
      policyPremium: number[]
      policyCashValue: number[]
      policyDeathBenefit: number[]
      ltcCosts: number[]
      ltcBenefits: number[]
    }
    person2: {
      workIncome: number[]
      socialSecurity: number[]
      pension: number[]
      policyIncome: number[]
      incomeNeeded: number[]
      assets401k: number[]
      policyPremium: number[]
      policyCashValue: number[]
      policyDeathBenefit: number[]
      ltcCosts: number[]
      ltcBenefits: number[]
    }
  }
  derivedData: {
    person1: {
      incomeGap: number[]
      ltcOutOfPocket: number[]
      netWorth: number[]
      netWorthNoPolicyScenario: number[]
    }
    person2: {
      incomeGap: number[]
      ltcOutOfPocket: number[]
      netWorth: number[]
      netWorthNoPolicyScenario: number[]
    }
    combined: {
      workIncome: number[]
      socialSecurity: number[]
      pension: number[]
      policyIncome: number[]
      incomeNeeded: number[]
      incomeGap: number[]
      assets401k: number[]
      policyPremium: number[]
      policyCashValue: number[]
      policyDeathBenefit: number[]
      ltcCosts: number[]
      ltcBenefits: number[]
      ltcOutOfPocket: number[]
      netWorth: number[]
      netWorthNoPolicyScenario: number[]
    }
  }
}

