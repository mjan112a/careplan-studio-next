import { PolicyData as SimulatorPolicyData } from './simulator-interfaces';

/**
 * Legacy policy data interface used by older components
 * This is kept for backwards compatibility
 */
export interface LegacyPolicyData {
  // Policy level information
  policyNumber: string;
  insuredName: string;
  productName: string;
  issueDate: string;
  annualPremium: number;
  initialDeathBenefit: number;

  // Riders and features
  hasLTCRider: boolean;
  ltcBenefitPercentage: number;
  maxMonthlyLTCBenefit: number;

  // Annual policy data
  annualData: LegacyAnnualPolicyData[];
}

/**
 * Legacy annual policy data interface
 */
export interface LegacyAnnualPolicyData {
  policyYear: number;
  age: number;
  surrenderValue: number;
  cashValue: number;
  deathBenefit: number;
}

/**
 * The current PolicyData type - re-exported from simulator-interfaces
 */
export type PolicyData = SimulatorPolicyData;

/**
 * Default legacy policy data for testing
 */
export const defaultPolicy: LegacyPolicyData = {
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
};

/**
 * Helper function to convert legacy policy data to the current format
 */
export function convertLegacyPolicyData(legacyPolicy: LegacyPolicyData): PolicyData {
  return {
    policy_level_information: {
      insured_person_name: legacyPolicy.insuredName,
      insured_person_age: legacyPolicy.annualData[0]?.age || 55,
      insured_person_gender: "Male", // Default since legacy doesn't have this
      insured_person_risk_classification: "Standard",
      product_name: legacyPolicy.productName,
      initial_premium: legacyPolicy.annualPremium,
      initial_death_benefit: legacyPolicy.initialDeathBenefit,
      policy_type: "traditional",
      riders_and_features: [
        {
          rider_feature_name: "LTC Rider",
          status: legacyPolicy.hasLTCRider ? "Elected" : "Not Elected",
          details: "Provides LTC benefits",
        }
      ]
    },
    annual_policy_data: legacyPolicy.annualData.map(annual => ({
      policy_year: annual.policyYear,
      insured_age: annual.age,
      annual_premium: legacyPolicy.annualPremium,
      accumulation_value: annual.cashValue,
      surrender_value: annual.surrenderValue,
      death_benefit: annual.deathBenefit,
      acceleration_percentage: 100,
      monthly_payout_percentage: legacyPolicy.ltcBenefitPercentage * 100,
      monthly_benefit_limit: legacyPolicy.maxMonthlyLTCBenefit
    }))
  };
}
