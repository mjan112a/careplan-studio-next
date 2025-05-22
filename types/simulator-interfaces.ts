/**
 * Simulator Interfaces
 * 
 * This file contains all interfaces required by the simulator page.
 * Any code providing data to the simulator should conform to these interfaces.
 * 
 * Note: YearlyFinancialData is imported from @/utils/financial-calculations
 */

/**
 * Policy Rider details
 */
export interface PolicyRider {
  rider_feature_name: string;
  status: string;
  details: string;
  form_number?: string;
  acceleration_percentage_elected?: number;
  monthly_payout_percentage_elected?: number;
  benefit_type?: string;
  irs_qualification?: string;
  elimination_period_days?: string;
}

/**
 * High-level policy information
 */
export interface PolicyLevelInformation {
  insured_person_name: string;
  insured_person_age: number;
  insured_person_gender: string;
  insured_person_risk_classification: string;
  product_name: string;
  initial_premium: number;
  initial_death_benefit: number;
  policy_type: "traditional" | "hybrid";  // Distinguishes between policy types
  riders_and_features: PolicyRider[];
}

/**
 * Annual data points for a policy
 */
export interface AnnualPolicyData {
  policy_year: number;
  insured_age: number;
  annual_premium: number;
  accumulation_value: number;
  surrender_value: number;
  death_benefit: number;
  acceleration_percentage: number;
  monthly_payout_percentage: number;
  monthly_benefit_limit: number;
  annual_ltc_benefit?: number;  // For hybrid policies
  total_ltc_benefit?: number;   // For hybrid policies
  death_benefit_irr?: number;   // For illustration data
  ltc_benefit_irr?: number;     // For illustration data
}

/**
 * Complete policy data structure
 */
export interface PolicyData {
  policy_level_information: PolicyLevelInformation;
  annual_policy_data: AnnualPolicyData[];
  _incomplete?: boolean;        // Flag for policies with incomplete data
  _original_doc_id?: string;    // Reference to original document
}

/**
 * Person data structure used throughout the simulator
 */
export interface Person {
  // Basic information
  name: string;
  age: number;
  sex: "male" | "female";

  // Financial parameters
  income: number;
  retirementSavings: number;
  annualSavings: number;
  incomeReplacementRatio: number;

  // Event toggles
  ltcEventEnabled: boolean;
  policyEnabled: boolean;
  policyLoanEnabled: boolean;
  initialPremiumFromAssets: boolean;
  premiumsFromAssetsPreRetirement: boolean;

  // Retirement parameters
  retirementAge: number;
  annualPayIncrease: number;
  socialSecurityIncome: number;
  otherRetirementIncome: number;
  retirementAssetsTaxRate: number;

  // LTC event parameters
  ltcEventAge: number;
  ltcCostPerYear: number;
  ltcDuration: number;

  // Policy parameters
  policyBenefitPerYear: number;
  policyBenefitDuration: number;
  policyAnnualPremium: number;
  policyLoanRate: number;
  policyMaxLoanToValueRatio?: number;

  // Assumptions
  preRetirementAssetReturns: number;
  assetReturns: number;
  ltcInflation: number;
  generalInflation: number;
  deathAge: number;
  marginalTaxRate: number;
}

/**
 * Default values for a Person object
 */
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
  premiumsFromAssetsPreRetirement: true,
  retirementAge: 67,
  annualPayIncrease: 0.03,
  socialSecurityIncome: 24000,
  otherRetirementIncome: 0,
  retirementAssetsTaxRate: 0.3,
  ltcEventAge: 75,
  ltcCostPerYear: 100000,
  ltcDuration: 4,
  policyBenefitPerYear: 80000,
  policyBenefitDuration: 3,
  policyAnnualPremium: 3000,
  policyLoanRate: 0.01,
  preRetirementAssetReturns: 0.07,
  assetReturns: 0.05,
  ltcInflation: 0.05,
  generalInflation: 0.025,
  deathAge: 90,
  marginalTaxRate: 0.25,
};

/**
 * Interface for components providing policy data to the simulator
 */
export interface PolicyDataProvider {
  /**
   * Fetches policy data for a list of document IDs
   * @param docIds Array of document IDs to fetch
   * @returns Promise resolving to an array of PolicyData or null
   */
  fetchPolicyData(docIds: string[]): Promise<PolicyData[] | null>;
  
  /**
   * Parses document IDs from the current URL
   * @returns Array of document IDs or null if none found
   */
  getDocumentIdsFromUrl(): string[] | null;
}

/**
 * Result of the usePolicyData hook
 */
export interface UsePolicyDataResult {
  /**
   * The loaded policy data or null if not available
   */
  policyData: PolicyData[] | null;
  
  /**
   * Whether the policy data is currently loading
   */
  loading: boolean;
  
  /**
   * Any error that occurred during loading
   */
  error: Error | null;
}

/**
 * Interface for components displaying financial projections
 */
export interface FinancialProjectionProps {
  /**
   * The financial projection data
   */
  data: any[]; // YearlyFinancialData[] from @/utils/financial-calculations
  
  /**
   * Optional comparison data (e.g., with policy turned off)
   */
  comparisonData?: any[]; // YearlyFinancialData[] from @/utils/financial-calculations
  
  /**
   * Title for the projection display
   */
  title: string;
  
  /**
   * Whether to show an LTC event in the projection
   */
  showLTCEvent?: boolean;
  
  /**
   * Whether to show retirement age in the projection
   */
  showRetirementAge?: boolean;
  
  /**
   * The retirement age to display
   */
  retirementAge?: number;
  
  /**
   * The LTC event age to display
   */
  ltcEventAge?: number;
  
  /**
   * Legacy assets value to display
   */
  legacyAssets?: number;
  
  /**
   * Person data for additional calculations
   */
  person?: Person;
  
  /**
   * Index of the person (0 for first person, 1 for second)
   */
  personIndex?: number;
  
  /**
   * Whether to show initial calculation details
   */
  showInitialCalculation?: boolean;
}

/**
 * Interface representing the global window properties used by the simulator
 */
export interface SimulatorGlobals {
  /**
   * Function to force a re-render of the simulator
   */
  forceSimulatorUpdate?: () => void;
}

// Extend the Window interface to include our custom properties
declare global {
  interface Window extends SimulatorGlobals {}
} 