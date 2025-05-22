import { Person as SimulatorPerson } from './simulator-interfaces';

/**
 * Legacy policy data interface used in financial calculations
 */
export interface FinancialPolicyData {
  year: number;
  premium: number;
  cashValue: number;
  deathBenefit: number;
  totalLTCBenefit: number;
  aobMonthly: number;
  cobMonthly: number;
}

/**
 * Financial person model used in older calculation modules
 */
export interface FinancialPerson {
  // Identity
  id: string;
  name: string;
  policyData: FinancialPolicyData[];
  enabled: boolean;
  active: boolean;

  // Financial Parameters
  annualIncome: number;
  payRaise: number;
  retirementAge: number;
  incomeReplacement: number;
  fourOhOneKBalance: number;
  annualContribution: number;
  expectedSocialSecurity: number;
  expectedPension: number;

  // LTC Event Parameters
  ltcEventEnabled: boolean;
  ltcEventAge: number;
  ltcMonthlyNeed: number;
  ltcDuration: number;
  currentAge: number;

  // Death Parameters
  deathAge: number; // New parameter for death age

  // Policy Parameters
  policyEnabled: boolean;
  isPremiumSingle: boolean;
  annualPremiumAmount: number;
  premiumYears: number;

  // Economic Assumptions
  assetReturnRate: number;
  retirementReturnRate: number;
  generalInflationRate: number;
  ltcInflationRate: number;

  // Calculated Results
  retirementData: YearlyData[];
  incomeGap: number;
  ltcGap: number;
  totalAssets: number;
  totalLtcNeeded: number;
  totalLtcCovered: number;
  bankrupt?: boolean;
  bankruptAge?: number;
  legacyAmount?: number; // New calculated field for legacy amount
}

/**
 * Per-year financial projection data
 */
export interface YearlyData {
  age: number;
  year: number;
  workIncome: number;
  socialSecurity: number;
  pension: number;
  policyIncome: number; // New income source from LTC policy
  incomeNeeded: number;
  incomeGap: number;
  assets401k: number;
  assets401kNoPolicyScenario: number;
  policyPremium: number;
  policyCashValue: number;
  policyDeathBenefit: number;
  ltcCosts: number;
  ltcBenefits: number;
  ltcOutOfPocket: number;
  netWorth: number;
  netWorthNoPolicyScenario: number;
  bankrupt?: boolean;
  bankruptAge?: number;
  isDeathYear?: boolean; // Flag to indicate if this is the year of death
}

/**
 * Combined yearly data for household calculations
 */
export interface CombinedYearlyData {
  age: number;
  year: number;
  projectionYear: number; // Added for year-based indexing
  yearsFromNow: number; // Added for easier reference
  [key: string]: number | boolean;
}

/**
 * Structured data matrix for visualization components
 */
export interface DataMatrix {
  yearsFromNow: number[];
  ages: {
    person1: number[];
    person2: number[];
  };
  baseData: {
    person1: {
      workIncome: number[];
      socialSecurity: number[];
      pension: number[];
      policyIncome: number[];
      incomeNeeded: number[];
      assets401k: number[];
      policyPremium: number[];
      policyCashValue: number[];
      policyDeathBenefit: number[];
      ltcCosts: number[];
      ltcBenefits: number[];
    };
    person2: {
      workIncome: number[];
      socialSecurity: number[];
      pension: number[];
      policyIncome: number[];
      incomeNeeded: number[];
      assets401k: number[];
      policyPremium: number[];
      policyCashValue: number[];
      policyDeathBenefit: number[];
      ltcCosts: number[];
      ltcBenefits: number[];
    };
  };
  derivedData: {
    person1: {
      incomeGap: number[];
      ltcOutOfPocket: number[];
      netWorth: number[];
      netWorthNoPolicyScenario: number[];
    };
    person2: {
      incomeGap: number[];
      ltcOutOfPocket: number[];
      netWorth: number[];
      netWorthNoPolicyScenario: number[];
    };
    combined: {
      workIncome: number[];
      socialSecurity: number[];
      pension: number[];
      policyIncome: number[];
      incomeNeeded: number[];
      incomeGap: number[];
      assets401k: number[];
      policyPremium: number[];
      policyCashValue: number[];
      policyDeathBenefit: number[];
      ltcCosts: number[];
      ltcBenefits: number[];
      ltcOutOfPocket: number[];
      netWorth: number[];
      netWorthNoPolicyScenario: number[];
    };
  };
}

/**
 * Convert a simulator person to a financial person model
 */
export function convertToFinancialPerson(person: SimulatorPerson): FinancialPerson {
  return {
    id: person.name.toLowerCase().replace(/\s+/g, '_'),
    name: person.name,
    policyData: [], // This needs to be populated separately
    enabled: true,
    active: true,
    
    annualIncome: person.income,
    payRaise: person.annualPayIncrease,
    retirementAge: person.retirementAge,
    incomeReplacement: person.incomeReplacementRatio,
    fourOhOneKBalance: person.retirementSavings,
    annualContribution: person.annualSavings,
    expectedSocialSecurity: person.socialSecurityIncome,
    expectedPension: person.otherRetirementIncome,
    
    ltcEventEnabled: person.ltcEventEnabled,
    ltcEventAge: person.ltcEventAge,
    ltcMonthlyNeed: person.ltcCostPerYear / 12,
    ltcDuration: person.ltcDuration,
    currentAge: person.age,
    
    deathAge: person.deathAge,
    
    policyEnabled: person.policyEnabled,
    isPremiumSingle: false,
    annualPremiumAmount: person.policyAnnualPremium,
    premiumYears: person.deathAge - person.age,
    
    assetReturnRate: person.preRetirementAssetReturns,
    retirementReturnRate: person.assetReturns,
    generalInflationRate: person.generalInflation,
    ltcInflationRate: person.ltcInflation,
    
    // These will be calculated later
    retirementData: [],
    incomeGap: 0,
    ltcGap: 0,
    totalAssets: person.retirementSavings,
    totalLtcNeeded: person.ltcCostPerYear * person.ltcDuration,
    totalLtcCovered: person.policyEnabled ? person.policyBenefitPerYear * person.policyBenefitDuration : 0
  };
}

