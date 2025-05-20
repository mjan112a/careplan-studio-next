export interface Person {
  // Basic information
  name: string
  age: number
  sex: "male" | "female"

  // Financial parameters
  income: number
  retirementSavings: number
  annualSavings: number
  incomeReplacementRatio: number

  // Event toggles
  ltcEventEnabled: boolean
  policyEnabled: boolean
  policyLoanEnabled: boolean
  initialPremiumFromAssets: boolean // Toggle for initial premium from assets
  premiumsFromAssetsPreRetirement: boolean // New toggle for pre-retirement premium source

  // Retirement parameters
  retirementAge: number
  annualPayIncrease: number
  socialSecurityIncome: number
  otherRetirementIncome: number
  retirementAssetsTaxRate: number

  // LTC event parameters
  ltcEventAge: number
  ltcCostPerYear: number
  ltcDuration: number

  // Policy parameters
  policyBenefitPerYear: number
  policyBenefitDuration: number
  policyAnnualPremium: number
  policyLoanRate: number // Field for policy loan interest rate
  policyMaxLoanToValueRatio?: number // Maximum loan-to-value ratio for policy loans (default: 0.95)

  // Assumptions
  preRetirementAssetReturns: number // New field for pre-retirement asset returns
  assetReturns: number // Now specifically for retirement period
  ltcInflation: number
  generalInflation: number
  deathAge: number
  marginalTaxRate: number
}

export const defaultPerson: Person = {
  name: "Person 1",
  age: 55,
  sex: "male",
  income: 100000,
  retirementSavings: 500000,
  annualSavings: 12000,
  incomeReplacementRatio: 0.65,
  ltcEventEnabled: false,
  policyEnabled: false,
  policyLoanEnabled: true,
  initialPremiumFromAssets: false,
  premiumsFromAssetsPreRetirement: true, // Default to paying from assets before retirement
  retirementAge: 67,
  annualPayIncrease: 0.03,
  socialSecurityIncome: 24000,
  otherRetirementIncome: 0,
  retirementAssetsTaxRate: 0.3,
  ltcEventAge: 75, // Changed from 80 to 75
  ltcCostPerYear: 100000,
  ltcDuration: 4,
  policyBenefitPerYear: 80000,
  policyBenefitDuration: 3,
  policyAnnualPremium: 3000,
  policyLoanRate: 0.01, // Default 1% loan rate
  preRetirementAssetReturns: 0.07, // Default 7% returns pre-retirement (more aggressive)
  assetReturns: 0.05, // Default 5% returns during retirement (more conservative)
  ltcInflation: 0.05,
  generalInflation: 0.025,
  deathAge: 90,
  marginalTaxRate: 0.25,
}
