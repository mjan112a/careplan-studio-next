// Add custom global typings for window object
declare global {
  interface Window {
    _customPolicyData?: PolicyData[];
  }
}

import { logger } from '@/lib/logging';
import { 
  PolicyData, 
  PolicyLevelInformation, 
  AnnualPolicyData, 
  PolicyRider 
} from './simulator-interfaces';
import { samplePolicyData } from './sample-policy-data';

// Extract JSON policy data from text that may be wrapped in markdown code blocks
function extractPolicyDataFromText(text: string): any[] {
  try {
    logger.debug('Attempting to extract policy data from text', {
      textLength: text.length,
      hasJsonBlock: text.includes('```json'),
      sample: text.substring(0, 200) + '...'
    });

    // Check if the text contains a markdown code block
    if (text.includes('```json')) {
      // Extract content between code fences
      const matches = text.match(/```json\s*([\s\S]*?)\s*```/);
      
      logger.debug('Found JSON code block', {
        hasMatches: !!matches,
        matchGroupsCount: matches?.length,
        matchSample: matches && matches[1] ? matches[1].substring(0, 100) + '...' : 'No match found'
      });
      
      if (matches && matches[1]) {
        // Parse the JSON inside the code block
        const jsonContent = matches[1].trim();
        const parsedData = JSON.parse(jsonContent);
        
        logger.debug('Successfully parsed JSON from code block', {
          dataType: Array.isArray(parsedData) ? 'array' : typeof parsedData,
          dataLength: Array.isArray(parsedData) ? parsedData.length : 'not an array',
          firstItem: Array.isArray(parsedData) && parsedData.length > 0 ? parsedData[0] : null
        });
        
        return parsedData;
      }
    }
    
    // If no code block, try parsing the text directly
    logger.debug('No JSON code block found, attempting to parse text directly');
    const parsedData = JSON.parse(text);
    
    logger.debug('Successfully parsed text directly', {
      dataType: Array.isArray(parsedData) ? 'array' : typeof parsedData,
      dataLength: Array.isArray(parsedData) ? parsedData.length : 'not an array'
    });
    
    return parsedData;
  } catch (error) {
    logger.error('Failed to extract policy data from text', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return [];
  }
}

// Function to get sample policy data for display
export function getSamplePolicyData(): PolicyData[] {
  // Check for custom data in window global
  if (typeof window !== 'undefined' && window._customPolicyData) {
    return window._customPolicyData;
  }
  
  // No custom data found, return a deep copy of the sample data
  return JSON.parse(JSON.stringify(samplePolicyData)) as PolicyData[];
}
// Function to get policy benefit for a specific age
export function getPolicyBenefitForAge(policyData: PolicyData[], personIndex: number, age: number): number {
  if (!policyData || policyData.length <= personIndex || personIndex < 0) {
    return 0 // Return 0 if policy data is missing
  }

  const policy = policyData[personIndex]

  // Check if this is a hybrid policy
  const isHybridPolicy = policy.policy_level_information.policy_type === "hybrid"

  const annualData = policy.annual_policy_data.find((data) => data.insured_age === age)
  if (annualData) {
    // For hybrid policies, use the annual LTC benefit if available
    if (isHybridPolicy && annualData.annual_ltc_benefit) {
      return annualData.annual_ltc_benefit
    }
    // Otherwise use the monthly benefit * 12
    return annualData.monthly_benefit_limit * 12
  }

  // If we don't find an exact age match, find the closest age that's less than or equal to the target age
  const closestData = policy.annual_policy_data
    .filter((data) => data.insured_age <= age)
    .sort((a, b) => b.insured_age - a.insured_age)[0]

  if (closestData) {
    // For hybrid policies, use the annual LTC benefit if available
    if (isHybridPolicy && closestData.annual_ltc_benefit) {
      return closestData.annual_ltc_benefit
    }
    // Otherwise use the monthly benefit * 12
    return closestData.monthly_benefit_limit * 12
  }

  return 0 // Default if no data found
}

// Function to get total LTC benefit for a specific age (for hybrid policies)
export function getTotalLTCBenefitForAge(policyData: PolicyData[], personIndex: number, age: number): number {
  if (!policyData || policyData.length <= personIndex || personIndex < 0) {
    return 0 // Return 0 if policy data is missing
  }

  const policy = policyData[personIndex]

  // Check if this is a hybrid policy
  const isHybridPolicy = policy.policy_level_information.policy_type === "hybrid"

  // If not a hybrid policy, return 0
  if (!isHybridPolicy) {
    return 0
  }

  const annualData = policy.annual_policy_data.find((data) => data.insured_age === age)
  if (annualData && annualData.total_ltc_benefit) {
    return annualData.total_ltc_benefit
  }

  // If we don't find an exact age match, find the closest age that's less than or equal to the target age
  const closestData = policy.annual_policy_data
    .filter((data) => data.insured_age <= age)
    .sort((a, b) => b.insured_age - a.insured_age)[0]

  if (closestData && closestData.total_ltc_benefit) {
    return closestData.total_ltc_benefit
  }

  return 0 // Default if no data found
}

// Function to get policy premium for a specific age
export function getPolicyPremiumForAge(policyData: PolicyData[], personIndex: number, age: number): number {
  if (!policyData || policyData.length <= personIndex || personIndex < 0) {
    return 0 // Return 0 if policy data is missing
  }

  const policy = policyData[personIndex]
  const annualData = policy.annual_policy_data.find((data) => data.insured_age === age)
  if (annualData) {
    return annualData.annual_premium
  }

  // If we don't find an exact age match, find the closest age that's less than or equal to the target age
  const closestData = policy.annual_policy_data
    .filter((data) => data.insured_age <= age)
    .sort((a, b) => b.insured_age - a.insured_age)[0]

  if (closestData) {
    return closestData.annual_premium
  }

  return 0 // Default if no data found
}

// Function to get policy cash value for a specific age
export function getPolicyCashValueForAge(policyData: PolicyData[], personIndex: number, age: number): number {
  if (!policyData || policyData.length <= personIndex || personIndex < 0) {
    return 0 // Return 0 if policy data is missing
  }

  const policy = policyData[personIndex]
  const annualData = policy.annual_policy_data.find((data) => data.insured_age === age)
  if (annualData) {
    return annualData.surrender_value
  }

  // If we don't find an exact age match, find the closest age that's less than or equal to the target age
  const closestData = policy.annual_policy_data
    .filter((data) => data.insured_age <= age)
    .sort((a, b) => b.insured_age - a.insured_age)[0]

  if (closestData) {
    return closestData.surrender_value
  }

  return 0 // Default if no data found
}

// Function to get policy death benefit for a specific age
export function getPolicyDeathBenefitForAge(policyData: PolicyData[], personIndex: number, age: number): number {
  if (!policyData || policyData.length <= personIndex || personIndex < 0) {
    return 0 // Return 0 if policy data is missing
  }

  const policy = policyData[personIndex]
  const annualData = policy.annual_policy_data.find((data) => data.insured_age === age)
  if (annualData) {
    return annualData.death_benefit
  }

  // If we don't find an exact age match, find the closest age that's less than or equal to the target age
  const closestData = policy.annual_policy_data
    .filter((data) => data.insured_age <= age)
    .sort((a, b) => b.insured_age - a.insured_age)[0]

  if (closestData) {
    return closestData.death_benefit
  }

  return 0 // Default if no data found
}

// Function to get policy data for a specific person
export function getPolicyDataForPerson(personIndex: number): PolicyData | null {
  if (personIndex >= 0 && personIndex < samplePolicyData.length) {
    return samplePolicyData[personIndex];
  }
  return null;
}
