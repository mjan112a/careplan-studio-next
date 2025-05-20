export interface PolicyData {
  // Policy level information
  policyNumber: string
  insuredName: string
  productName: string
  issueDate: string
  annualPremium: number
  initialDeathBenefit: number

  // Riders and features
  hasLTCRider: boolean
  ltcBenefitPercentage: number
  maxMonthlyLTCBenefit: number

  // Annual policy data
  annualData: AnnualPolicyData[]
}

export interface AnnualPolicyData {
  policyYear: number
  age: number
  surrenderValue: number
  cashValue: number
  deathBenefit: number
}

export const defaultPolicy: PolicyData = {
  policyNumber: "POL123456",
  insuredName: "John Doe",
  productName: "Comprehensive LTC Protection",
  issueDate: "2023-01-01",
  annualPremium: 3000,
  initialDeathBenefit: 250000,
  hasLTCRider: true,
  ltcBenefitPercentage: 0.02,
  maxMonthlyLTCBenefit: 6000,
  annualData: Array.from({ length: 40 }, (_, i) => ({
    policyYear: i + 1,
    age: 55 + i,
    surrenderValue: Math.round(i < 10 ? 3000 * i * 0.8 : 3000 * 10 * 0.8 + 3000 * (i - 10) * 0.9),
    cashValue: Math.round(i < 10 ? 3000 * i * 0.9 : 3000 * 10 * 0.9 + 3000 * (i - 10)),
    deathBenefit: 250000,
  })),
}
