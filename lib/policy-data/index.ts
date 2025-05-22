import { logger } from '@/lib/logging';
import { PolicyData, AnnualPolicyData, PolicyLevelInformation, PolicyRider } from '@/types/simulator-interfaces';
import { useEffect, useState } from 'react';
import { getSamplePolicyData } from '@/types/policy-data';

/**
 * Maps raw policy data from the database to the expected PolicyData format
 * Handles incomplete data by filling in default values where necessary
 */
export function mapProcessedDataToPolicyData(
  processedData: any, 
  index: number = 0, 
  mergeSampleData: boolean = false
): PolicyData {
  // If we should embellish with sample data, start with the sample data as a base
  const sampleData = mergeSampleData ? getSamplePolicyData()[index < getSamplePolicyData().length ? index : 0] : null;
  
  try {
    // If the data is already in the correct format, just return it
    if (processedData && 
        processedData.policy_level_information && 
        processedData.annual_policy_data) {
      logger.debug('Data already in correct format', {
        dataFormat: 'structured',
        hasAnnualData: Array.isArray(processedData.annual_policy_data) && processedData.annual_policy_data.length > 0
      });
      return processedData;
    }
    
    // Check for Gemini API response format
    if (processedData && 
        processedData.candidates && 
        Array.isArray(processedData.candidates) && 
        processedData.candidates.length > 0 &&
        processedData.candidates[0].content?.parts?.[0]?.text) {
      
      // Extract JSON text from the Gemini response
      const jsonText = processedData.candidates[0].content.parts[0].text;
      
      // The text may contain markdown code blocks, so extract just the JSON part
      let jsonDataText = jsonText;
      if (jsonText.includes('```json')) {
        // Extract content between ```json and ```
        const match = jsonText.match(/```json\n([\s\S]*?)```/);
        if (match && match[1]) {
          jsonDataText = match[1];
        }
      } else if (jsonText.includes('```')) {
        // Extract content between ``` and ```
        const match = jsonText.match(/```\n([\s\S]*?)```/);
        if (match && match[1]) {
          jsonDataText = match[1];
        }
      }
      
      // Parse the JSON text to get the actual data array
      try {
        const annualDataArray = JSON.parse(jsonDataText);
        
        if (Array.isArray(annualDataArray)) {
          logger.debug('Successfully parsed Gemini response data', {
            dataLength: annualDataArray.length
          });
          
          // Now that we have the array, apply the same mapping logic
          // Extract basic information from the first year of data
          const firstYear = annualDataArray[0] || {};
          const initialAge = firstYear.insured_age || (sampleData?.policy_level_information.insured_person_age || 55);
          const initialPremium = firstYear.annual_premium || (sampleData?.policy_level_information.initial_premium || 0);
          const initialDeathBenefit = firstYear.death_benefit || (sampleData?.policy_level_information.initial_death_benefit || 0);
          
          // Create policy level information with defaults or values from the first data point
          const policyLevelInformation: PolicyLevelInformation = {
            insured_person_name: sampleData?.policy_level_information.insured_person_name || `Person ${index + 1}`,
            insured_person_age: initialAge,
            insured_person_gender: sampleData?.policy_level_information.insured_person_gender || (index === 0 ? "Male" : "Female"),
            insured_person_risk_classification: sampleData?.policy_level_information.insured_person_risk_classification || "Standard Non-Nicotine",
            product_name: sampleData?.policy_level_information.product_name || "Unknown Policy Type",
            initial_premium: initialPremium,
            initial_death_benefit: initialDeathBenefit,
            policy_type: sampleData?.policy_level_information.policy_type || "traditional",
            riders_and_features: sampleData?.policy_level_information.riders_and_features || [],
          };
          
          // Map each data point to the annual policy data format
          const annualPolicyData: AnnualPolicyData[] = annualDataArray.map((yearData: any): AnnualPolicyData => {
            // For each year of annual data, create AnnualPolicyData with defaults or available values
            const mappedYearData: AnnualPolicyData = {
              policy_year: yearData.policy_year,
              insured_age: yearData.insured_age,
              annual_premium: yearData.annual_premium || 0,
              accumulation_value: yearData.accumulation_value || 0,
              surrender_value: yearData.surrender_value || 0,
              death_benefit: yearData.death_benefit || 0,
              
              // Fill in standard LTC fields with defaults or sample data values if available
              acceleration_percentage: yearData.acceleration_percentage || 
                (sampleData?.annual_policy_data[yearData.policy_year - 1]?.acceleration_percentage || 100),
              monthly_payout_percentage: yearData.monthly_payout_percentage || 
                (sampleData?.annual_policy_data[yearData.policy_year - 1]?.monthly_payout_percentage || 4),
              monthly_benefit_limit: yearData.monthly_benefit_limit || 
                (sampleData?.annual_policy_data[yearData.policy_year - 1]?.monthly_benefit_limit || yearData.death_benefit * 0.04 / 12),
            };
            
            // Add optional fields for hybrid policies if available
            if (yearData.annual_ltc_benefit !== undefined || (mergeSampleData && sampleData?.annual_policy_data[yearData.policy_year - 1]?.annual_ltc_benefit !== undefined)) {
              mappedYearData.annual_ltc_benefit = yearData.annual_ltc_benefit || 
                (sampleData?.annual_policy_data[yearData.policy_year - 1]?.annual_ltc_benefit);
            }
            
            if (yearData.total_ltc_benefit !== undefined || (mergeSampleData && sampleData?.annual_policy_data[yearData.policy_year - 1]?.total_ltc_benefit !== undefined)) {
              mappedYearData.total_ltc_benefit = yearData.total_ltc_benefit || 
                (sampleData?.annual_policy_data[yearData.policy_year - 1]?.total_ltc_benefit);
            }
            
            if (yearData.death_benefit_irr !== undefined || (mergeSampleData && sampleData?.annual_policy_data[yearData.policy_year - 1]?.death_benefit_irr !== undefined)) {
              mappedYearData.death_benefit_irr = yearData.death_benefit_irr || 
                (sampleData?.annual_policy_data[yearData.policy_year - 1]?.death_benefit_irr);
            }
            
            if (yearData.ltc_benefit_irr !== undefined || (mergeSampleData && sampleData?.annual_policy_data[yearData.policy_year - 1]?.ltc_benefit_irr !== undefined)) {
              mappedYearData.ltc_benefit_irr = yearData.ltc_benefit_irr || 
                (sampleData?.annual_policy_data[yearData.policy_year - 1]?.ltc_benefit_irr);
            }
            
            return mappedYearData;
          });
          
          return {
            policy_level_information: policyLevelInformation,
            annual_policy_data: annualPolicyData,
            _incomplete: true // Flag to indicate this data was auto-mapped
          };
        }
      } catch (parseError) {
        logger.error('Error parsing JSON from Gemini response', {
          error: parseError instanceof Error ? parseError.message : String(parseError),
          jsonText: jsonDataText.substring(0, 100) + '...' // Log just the start of the text
        });
      }
    }
    
    // If processedData is an array of annual data points 
    // (like the examples in the query showing policy_year, insured_age, etc.)
    if (Array.isArray(processedData)) {
      logger.debug('Mapping array-format processed data', {
        dataLength: processedData.length
      });
      
      // Extract basic information from the first year of data
      const firstYear = processedData[0] || {};
      const initialAge = firstYear.insured_age || (sampleData?.policy_level_information.insured_person_age || 55);
      const initialPremium = firstYear.annual_premium || (sampleData?.policy_level_information.initial_premium || 0);
      const initialDeathBenefit = firstYear.death_benefit || (sampleData?.policy_level_information.initial_death_benefit || 0);
      
      // Create policy level information with defaults or values from the first data point
      const policyLevelInformation: PolicyLevelInformation = {
        insured_person_name: sampleData?.policy_level_information.insured_person_name || `Person ${index + 1}`,
        insured_person_age: initialAge,
        insured_person_gender: sampleData?.policy_level_information.insured_person_gender || (index === 0 ? "Male" : "Female"),
        insured_person_risk_classification: sampleData?.policy_level_information.insured_person_risk_classification || "Standard Non-Nicotine",
        product_name: sampleData?.policy_level_information.product_name || "Unknown Policy Type",
        initial_premium: initialPremium,
        initial_death_benefit: initialDeathBenefit,
        policy_type: sampleData?.policy_level_information.policy_type || "traditional",
        riders_and_features: sampleData?.policy_level_information.riders_and_features || [],
      };
      
      // Map each data point to the annual policy data format
      const annualPolicyData: AnnualPolicyData[] = processedData.map((yearData: any): AnnualPolicyData => {
        // For each year of annual data, create AnnualPolicyData with defaults or available values
        const mappedYearData: AnnualPolicyData = {
          policy_year: yearData.policy_year,
          insured_age: yearData.insured_age,
          annual_premium: yearData.annual_premium || 0,
          accumulation_value: yearData.accumulation_value || 0,
          surrender_value: yearData.surrender_value || 0,
          death_benefit: yearData.death_benefit || 0,
          
          // Fill in standard LTC fields with defaults or sample data values if available
          acceleration_percentage: yearData.acceleration_percentage || 
            (sampleData?.annual_policy_data[yearData.policy_year - 1]?.acceleration_percentage || 100),
          monthly_payout_percentage: yearData.monthly_payout_percentage || 
            (sampleData?.annual_policy_data[yearData.policy_year - 1]?.monthly_payout_percentage || 4),
          monthly_benefit_limit: yearData.monthly_benefit_limit || 
            (sampleData?.annual_policy_data[yearData.policy_year - 1]?.monthly_benefit_limit || yearData.death_benefit * 0.04 / 12),
        };
        
        // Add optional fields for hybrid policies if available
        if (yearData.annual_ltc_benefit !== undefined || (mergeSampleData && sampleData?.annual_policy_data[yearData.policy_year - 1]?.annual_ltc_benefit !== undefined)) {
          mappedYearData.annual_ltc_benefit = yearData.annual_ltc_benefit || 
            (sampleData?.annual_policy_data[yearData.policy_year - 1]?.annual_ltc_benefit);
        }
        
        if (yearData.total_ltc_benefit !== undefined || (mergeSampleData && sampleData?.annual_policy_data[yearData.policy_year - 1]?.total_ltc_benefit !== undefined)) {
          mappedYearData.total_ltc_benefit = yearData.total_ltc_benefit || 
            (sampleData?.annual_policy_data[yearData.policy_year - 1]?.total_ltc_benefit);
        }
        
        if (yearData.death_benefit_irr !== undefined || (mergeSampleData && sampleData?.annual_policy_data[yearData.policy_year - 1]?.death_benefit_irr !== undefined)) {
          mappedYearData.death_benefit_irr = yearData.death_benefit_irr || 
            (sampleData?.annual_policy_data[yearData.policy_year - 1]?.death_benefit_irr);
        }
        
        if (yearData.ltc_benefit_irr !== undefined || (mergeSampleData && sampleData?.annual_policy_data[yearData.policy_year - 1]?.ltc_benefit_irr !== undefined)) {
          mappedYearData.ltc_benefit_irr = yearData.ltc_benefit_irr || 
            (sampleData?.annual_policy_data[yearData.policy_year - 1]?.ltc_benefit_irr);
        }
        
        return mappedYearData;
      });
      
      return {
        policy_level_information: policyLevelInformation,
        annual_policy_data: annualPolicyData,
        _incomplete: true // Flag to indicate this data was auto-mapped
      };
    }
    
    // If we get here, the data is in an unexpected format
    logger.warn('Unknown processed data format', { 
      dataType: typeof processedData,
      isArray: Array.isArray(processedData),
      hasGeminiFormat: processedData && processedData.candidates ? true : false
    });
    
    // Return sample data as fallback
    return sampleData || getSamplePolicyData()[0];
    
  } catch (error) {
    logger.error('Error mapping processed data to policy data', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Return sample data as fallback
    return sampleData || getSamplePolicyData()[0];
  }
}

/**
 * Fetches policy data for the provided document IDs
 */
export async function fetchPolicyData(docIds: string[], mergeSampleData: boolean = false): Promise<PolicyData[] | null> {
  try {
    logger.info('Fetching policy data', { docIds });
    
    if (!docIds || docIds.length === 0) {
      return null;
    }
    
    // Use the bulk fetch endpoint (POST) to get all documents at once
    const response = await fetch('/api/policy-documents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ documentIds: docIds }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch policy documents: ${response.status}`);
    }
    
    const { documents } = await response.json();
    
    if (!documents || documents.length === 0) {
      logger.warn('No policy documents found', { docIds });
      return null;
    }
    
    // Process the results
    const policyData = documents
      .filter((doc: any) => doc && doc.processed_data)
      .map((doc: any, index: number) => {
        // Add a reference to the original document ID
        logger.debug(`Processing document ${index + 1}/${documents.length}`, {
          docId: doc.id,
          hasProcessedData: !!doc.processed_data,
          processedDataType: typeof doc.processed_data,
          isGeminiFormat: doc.processed_data && doc.processed_data.candidates ? true : false
        });
        
        const mappedData = mapProcessedDataToPolicyData(doc.processed_data, index, mergeSampleData);
        return {
          ...mappedData,
          _original_doc_id: doc.id
        };
      });
    
    logger.debug('Successfully fetched policy data', { 
      count: policyData.length,
      hasData: policyData.length > 0,
      docIds: docIds.length
    });
    
    if (policyData.length === 0) {
      return null;
    }
    
    return policyData;
  } catch (error) {
    logger.error('Error fetching policy data', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      docIds
    });
    return null;
  }
}

/**
 * Parses document IDs from URL query parameters
 */
export function getDocumentIdsFromUrl(): string[] | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const url = new URL(window.location.href);
    
    // Check for doc_ids parameter (comma-separated list)
    const docIdsParam = url.searchParams.get('doc_ids');
    if (docIdsParam) {
      const ids = docIdsParam.split(',').filter(Boolean);
      if (ids.length > 0) {
        return ids;
      }
    }
    
    // No document IDs found
    logger.debug('No document IDs found in URL parameters');
  } catch (error) {
    logger.error('Failed to parse URL for document IDs', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
  
  return null;
}

/**
 * A hook to manage policy data state and initialization
 */
interface UsePolicyDataResult {
  policyData: PolicyData[] | null;
  loading: boolean;
  error: Error | null;
}

export function usePolicyData(mergeSampleData: boolean = false): UsePolicyDataResult {
  const [policyData, setPolicyData] = useState<PolicyData[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function initPolicyData() {
      try {
        setLoading(true);
        
        // Try to get document IDs from URL
        const docIds = getDocumentIdsFromUrl();
        
        if (docIds && docIds.length > 0) {
          const data = await fetchPolicyData(docIds, mergeSampleData);
          setPolicyData(data);
        } else {
          // No document IDs found, use sample data
          const data = getSamplePolicyData();
          setPolicyData(data);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        logger.error('Error initializing policy data', {
          error: error.message,
          stack: error.stack
        });
        setError(error);
      } finally {
        setLoading(false);
      }
    }
    
    initPolicyData();
  }, [mergeSampleData]);
  
  return { policyData, loading, error };
}

// Export getSamplePolicyData for easier component imports
export { getSamplePolicyData } from '@/types/policy-data'; 