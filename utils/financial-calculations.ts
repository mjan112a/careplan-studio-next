import type { Person } from "@/types/person"
import { getSamplePolicyData, getTotalLTCBenefitForAge } from "@/types/policy-data"
import { logger } from "@/lib/logging"

export interface YearlyFinancialData {
  age: number
  year: number
  income: number
  workIncome: number
  socialSecurityIncome: number
  otherRetirementIncome: number
  expenses: number
  basicExpenses: number
  ltcExpenses: number
  premiumExpenses: number
  ltcBenefits: number
  netCashFlow: number
  withdrawal: number
  taxOnWithdrawal: number
  assets: number
  policyValue: number
  totalAssets: number
  cumulativeLTCBenefits: number
  hasLTCEvent: boolean
  isAlive: boolean
  deathBenefit: number
  policyYear: number
  policyLoanTaken: number
  policyLoanBalance: number
  policyLoanInterest: number
  appliedGrowthRate?: number
  originalPolicyValue?: number
  originalDeathBenefit?: number
  totalLTCBenefit?: number // Added for hybrid policies
}

export function calculateFinancialProjection(
  person: Person,
  personIndex = 0,
  useActualPolicy = true,
  shiftPolicyYear = false,
): YearlyFinancialData[] {
  const projection: YearlyFinancialData[] = []
  let currentAssets = person.retirementSavings
  let cumulativeLTCBenefits = 0
  let policyLoanBalance = 0
  
  // Get policy data - prefer window global to ensure consistency across the application
  const policyData = typeof window !== 'undefined' && window._customPolicyData 
    ? window._customPolicyData 
    : getSamplePolicyData()
  
  // Get policy data summary for this calculation
  const hasPolicyData = policyData && policyData.length > personIndex && personIndex >= 0
  const personPolicy = hasPolicyData ? policyData[personIndex] : null
  
  // Log a single concise message with the calculation context
  if (personPolicy) {
    logger.info('Financial calculator initialized', {
      personIndex,
      personName: person.name,
      policyType: personPolicy.policy_level_information.policy_type,
      productName: personPolicy.policy_level_information.product_name,
      useActualPolicy,
      policyEnabled: person.policyEnabled
    });
  }

  // Check if this is a hybrid policy
  const isHybridPolicy = personPolicy?.policy_level_information.policy_type === "hybrid"

  // Get policy start age (the age when the policy was issued)
  const policyStartAge = personPolicy?.policy_level_information.insured_person_age || person.age

  // Track whether we've deviated from the illustration
  let hasDeviatedFromIllustration = false

  // Track previous year's adjusted policy values
  let previousPolicyValue = 0
  let previousDeathBenefit = 0

  // Pre-calculate growth rates from policy data for easier lookup
  const cashValueGrowthRates: { [policyYear: number]: number } = {}
  const deathBenefitGrowthRates: { [policyYear: number]: number } = {}

  if (useActualPolicy && hasPolicyData && personPolicy) {
    personPolicy.annual_policy_data.forEach((data, index) => {
      if (index === 0) return // Skip first year

      const prevData = personPolicy.annual_policy_data[index - 1]

      // Calculate cash value growth rate
      if (prevData.surrender_value > 0) {
        cashValueGrowthRates[data.policy_year] = data.surrender_value / prevData.surrender_value - 1
      } else {
        cashValueGrowthRates[data.policy_year] = 0
      }

      // Calculate death benefit growth rate
      if (prevData.death_benefit > 0) {
        deathBenefitGrowthRates[data.policy_year] = data.death_benefit / prevData.death_benefit - 1
      } else {
        deathBenefitGrowthRates[data.policy_year] = 0
      }
    })
  }

  // Handle initial premium payment from assets if policy is enabled and initialPremiumFromAssets is true
  if (person.policyEnabled && person.initialPremiumFromAssets) {
    // Get the initial premium amount
    let initialPremium = 0
    if (useActualPolicy && hasPolicyData && personPolicy) {
      // Use the first year premium from policy data
      initialPremium = personPolicy.policy_level_information.initial_premium
    } else {
      // Use the configured premium amount
      initialPremium = person.policyAnnualPremium
    }

    // Calculate the gross withdrawal needed to cover premium + tax
    const initialPremiumWithdrawal = initialPremium / (1 - person.retirementAssetsTaxRate)

    // Deduct the initial premium withdrawal from assets
    currentAssets = Math.max(0, currentAssets - initialPremiumWithdrawal)
  }

  // Track if we've had an LTC event in the past
  let hadLTCEvent = false

  // Use a smoothing approach for policy loans to prevent oscillation
  let smoothedPolicyLoanAmount = 0
  const smoothingFactor = 0.5 // Adjust this value to control smoothing strength (0-1)

  // Project from current age to death age
  for (let age = person.age; age <= person.deathAge; age++) {
    const year = age - person.age

    // Calculate the policy year based on current age, with optional shift
    const policyYear = shiftPolicyYear
      ? age - policyStartAge // Shifted by 1 year (year 1 becomes year 0)
      : age - policyStartAge + 1 // Normal calculation

    const isRetired = age >= person.retirementAge
    const hasLTCEvent =
      person.ltcEventEnabled && age >= person.ltcEventAge && age < person.ltcEventAge + person.ltcDuration

    // Update our tracking of whether we've had an LTC event
    if (hasLTCEvent) {
      hadLTCEvent = true
    }

    // Calculate income
    // If there's an LTC event before retirement, reduce work income by 80%
    // This simulates income loss due to inability to work during an LTC event
    let workIncomeReductionFactor = 1.0
    if (hasLTCEvent && !isRetired) {
      workIncomeReductionFactor = 0.2 // Reduce to 20% of normal income during LTC event
    }

    const workIncome = !isRetired
      ? person.income * Math.pow(1 + person.annualPayIncrease, year) * workIncomeReductionFactor
      : 0

    const socialSecurityIncome = isRetired
      ? person.socialSecurityIncome * Math.pow(1 + person.generalInflation, year)
      : 0

    const otherRetirementIncome = isRetired
      ? person.otherRetirementIncome * Math.pow(1 + person.generalInflation, year)
      : 0

    const totalIncome = workIncome + socialSecurityIncome + otherRetirementIncome

    // Calculate expenses
    // If there's an LTC event before retirement, add basic living expenses
    // This simulates that the person still needs to cover basic living costs
    const basicExpenses =
      isRetired || (hasLTCEvent && !isRetired)
        ? person.income *
          person.incomeReplacementRatio *
          Math.pow(1 + person.generalInflation, year) *
          (1 - person.retirementAssetsTaxRate)
        : 0

    const ltcExpenses = hasLTCEvent ? person.ltcCostPerYear * Math.pow(1 + person.ltcInflation, age - person.age) : 0

    // Get premium from policy data if using actual policy
    let premiumExpenses = 0
    if (person.policyEnabled) {
      if (useActualPolicy && hasPolicyData && personPolicy) {
        // Find the annual policy data for the current policy year, accounting for shift if enabled
        const annualData = personPolicy.annual_policy_data.find((data) => data.policy_year === policyYear)

        // If we don't find an exact match for the policy year, find the closest one that's less than or equal
        const closestData = !annualData
          ? personPolicy.annual_policy_data
              .filter((data) => data.policy_year <= policyYear)
              .sort((a, b) => b.policy_year - a.policy_year)[0]
          : null

        const policyDataForYear = annualData || closestData

        if (policyDataForYear) {
          // Use the data we found
          premiumExpenses = policyDataForYear.annual_premium
        } else {
          // Fallback to simplified calculation
          premiumExpenses = age < person.deathAge ? person.policyAnnualPremium : 0
        }
      } else {
        premiumExpenses = age < person.deathAge ? person.policyAnnualPremium : 0
      }

      // Skip the first year premium if it's already been paid from assets
      // or if it's being paid from another source (initialPremiumFromAssets is false)
      if (year === 0) {
        // If initialPremiumFromAssets is true, we've already deducted it above
        // If initialPremiumFromAssets is false, we don't count it as an expense (paid by "magic coupon")
        premiumExpenses = 0
      }
    }

    const totalExpenses = basicExpenses + ltcExpenses + premiumExpenses

    // Calculate LTC benefits
    let ltcBenefits = 0
    let totalLTCBenefit = 0

    if (person.policyEnabled && hasLTCEvent) {
      if (useActualPolicy && hasPolicyData && personPolicy) {
        // For hybrid policies, handle benefits differently
        if (isHybridPolicy) {
          // Get the annual LTC benefit from the policy data, accounting for shift if enabled
          const annualData = personPolicy.annual_policy_data.find((data) => data.policy_year === policyYear)

          // If we don't find an exact match for the policy year, find the closest one that's less than or equal
          const closestData = !annualData
            ? personPolicy.annual_policy_data
                .filter((data) => data.policy_year <= policyYear)
                .sort((a, b) => b.policy_year - a.policy_year)[0]
            : null

          const policyDataForYear = annualData || closestData

          if (policyDataForYear && policyDataForYear.annual_ltc_benefit) {
            // For hybrid policies, use the annual LTC benefit directly
            ltcBenefits = Math.min(policyDataForYear.annual_ltc_benefit, ltcExpenses)

            // Track cumulative benefits paid
            cumulativeLTCBenefits += ltcBenefits

            // Get the total LTC benefit available
            if (policyDataForYear.total_ltc_benefit) {
              totalLTCBenefit = policyDataForYear.total_ltc_benefit
            }

            // Check if we've exceeded the maximum benefit
            if (cumulativeLTCBenefits > totalLTCBenefit) {
              // Cap the benefits at the maximum
              ltcBenefits -= cumulativeLTCBenefits - totalLTCBenefit
              cumulativeLTCBenefits = totalLTCBenefit
            }
          }
        } else {
          // Traditional policy - use existing logic
          // Find the annual policy data for the current policy year, accounting for shift if enabled
          const annualData = personPolicy.annual_policy_data.find((data) => data.policy_year === policyYear)

          // If we don't find an exact match for the policy year, find the closest one that's less than or equal
          const closestData = !annualData
            ? personPolicy.annual_policy_data
                .filter((data) => data.policy_year <= policyYear)
                .sort((a, b) => b.policy_year - a.policy_year)[0]
            : null

          const policyDataForYear = annualData || closestData

          if (policyDataForYear) {
            // Check if we're within the benefit period (typically based on rider terms)
            const ltcRider = personPolicy.policy_level_information.riders_and_features.find((rider) =>
              rider.rider_feature_name.toLowerCase().includes("chronic"),
            )

            // Most policies have a maximum benefit period or percentage of death benefit
            // For this simulation, we'll use the monthly benefit limit from the policy data
            const monthlyBenefit = policyDataForYear.monthly_benefit_limit
            const annualBenefit = monthlyBenefit * 12

            // Apply the benefit up to the actual LTC expenses
            ltcBenefits = Math.min(annualBenefit, ltcExpenses)

            // Track cumulative benefits paid
            cumulativeLTCBenefits += ltcBenefits

            // Check if we've exceeded the maximum benefit (typically a percentage of death benefit)
            const maxBenefit =
              policyDataForYear.death_benefit * ((ltcRider?.acceleration_percentage_elected || 100) / 100)

            if (cumulativeLTCBenefits > maxBenefit) {
              // Cap the benefits at the maximum
              ltcBenefits -= cumulativeLTCBenefits - maxBenefit
              cumulativeLTCBenefits = maxBenefit
            }
          }
        }
      } else {
        // Use simplified benefit calculation
        ltcBenefits =
          age < person.ltcEventAge + person.policyBenefitDuration
            ? Math.min(person.policyBenefitPerYear, ltcExpenses)
            : 0
        cumulativeLTCBenefits += ltcBenefits
      }
    }

    // Get policy values from actual policy data
    let policyValue = 0
    let deathBenefit = 0
    let appliedGrowthRate = 0
    let originalPolicyValue = 0
    let originalDeathBenefit = 0

    if (person.policyEnabled) {
      if (useActualPolicy && hasPolicyData && personPolicy) {
        // Find the annual policy data for the current policy year, accounting for shift if enabled
        const annualData = personPolicy.annual_policy_data.find((data) => data.policy_year === policyYear)

        // If we don't find an exact match for the policy year, find the closest one that's less than or equal
        const closestData = !annualData
          ? personPolicy.annual_policy_data
              .filter((data) => data.policy_year <= policyYear)
              .sort((a, b) => b.policy_year - a.policy_year)[0]
          : null

        const policyDataForYear = annualData || closestData

        if (policyDataForYear) {
          // Store the original values from the illustration
          originalPolicyValue = policyDataForYear.surrender_value
          originalDeathBenefit = policyDataForYear.death_benefit

          // If we've had an LTC event or loan, use the growth rates to project from adjusted values
          if (hasDeviatedFromIllustration && policyYear > 1) {
            // Get the growth rates for this policy year from our pre-calculated values
            const cashValueGrowthRate = cashValueGrowthRates[policyYear] || 0
            const deathBenefitGrowthRate = deathBenefitGrowthRates[policyYear] || 0

            // Use the previous year's adjusted values and grow them using the rates from the illustration
            policyValue = previousPolicyValue * (1 + cashValueGrowthRate)
            deathBenefit = previousDeathBenefit * (1 + deathBenefitGrowthRate)

            // Track the growth rate we applied
            appliedGrowthRate = deathBenefitGrowthRate
          } else {
            // No events yet or first year, use illustration values
            policyValue = policyDataForYear.surrender_value
            deathBenefit = policyDataForYear.death_benefit
          }

          // Only adjust for LTC benefits if we're in an LTC event
          if (hasLTCEvent && ltcBenefits > 0) {
            if (isHybridPolicy) {
              // For hybrid policies, the death benefit and cash value typically remain unchanged
              // when LTC benefits are paid, as they come from a separate pool
              // No adjustment needed
            } else {
              // For traditional policies, reduce death benefit by benefits paid this year (1:1 deduction)
              deathBenefit = Math.max(0, deathBenefit - ltcBenefits)

              // Reduce policy value by the same amount (1:1 deduction)
              policyValue = Math.max(0, policyValue - ltcBenefits)

              // Mark that we've deviated from the illustration
              hasDeviatedFromIllustration = true
            }
          }
        }
      } else {
        // Simplified policy value calculation
        policyValue = person.policyAnnualPremium * Math.min(year, 15) * 0.8
        deathBenefit = person.policyEnabled ? person.policyBenefitPerYear * person.policyBenefitDuration : 0
      }
    }

    // Calculate policy loan interest on existing loan balance
    const policyLoanInterest = policyLoanBalance * person.policyLoanRate

    // Update loan balance with interest
    policyLoanBalance += policyLoanInterest

    // Calculate net cash flow
    let netCashFlow = totalIncome + ltcBenefits - totalExpenses

    // Initialize policy loan taken this year
    let policyLoanTaken = 0
    let withdrawal = 0
    let taxOnWithdrawal = 0

    // Handle pre-retirement premium payments from assets if enabled
    let premiumWithdrawal = 0
    let taxOnPremiumWithdrawal = 0

    if (!isRetired && person.policyEnabled && premiumExpenses > 0 && person.premiumsFromAssetsPreRetirement) {
      // Calculate the gross withdrawal needed to cover premium + tax
      premiumWithdrawal = premiumExpenses / (1 - person.retirementAssetsTaxRate)
      taxOnPremiumWithdrawal = premiumWithdrawal * person.retirementAssetsTaxRate

      // Limit withdrawal to available assets
      if (premiumWithdrawal > currentAssets) {
        premiumWithdrawal = currentAssets
        taxOnPremiumWithdrawal = premiumWithdrawal * person.retirementAssetsTaxRate
      }

      // Add these to the total withdrawal and tax
      withdrawal += premiumWithdrawal
      taxOnWithdrawal += taxOnPremiumWithdrawal

      // Adjust net cash flow to reflect that premiums are paid from assets, not income
      // This prevents double-counting the premium expense
      const premiumPaidFromAssets = Math.min(premiumExpenses, premiumWithdrawal * (1 - person.retirementAssetsTaxRate))
      netCashFlow += premiumPaidFromAssets
    }

    // Special handling for pre-retirement LTC events
    // If there's an LTC event before retirement, we may need to withdraw from assets
    // to cover the income shortfall and LTC expenses
    if (hasLTCEvent && !isRetired) {
      // We've already reduced work income and added basic expenses above
      // Now we need to handle any cash shortfall more aggressively
      if (netCashFlow < 0 && currentAssets > 0) {
        // Calculate additional withdrawal needed for pre-retirement LTC shortfall
        const ltcShortfall = -netCashFlow
        const ltcShortfallWithdrawal = ltcShortfall / (1 - person.retirementAssetsTaxRate)
        const ltcShortfallTax = ltcShortfallWithdrawal * person.retirementAssetsTaxRate

        // Limit withdrawal to available assets
        if (ltcShortfallWithdrawal + withdrawal > currentAssets) {
          const remainingAssets = Math.max(0, currentAssets - withdrawal)
          const additionalWithdrawal = remainingAssets
          const additionalTax = additionalWithdrawal * person.retirementAssetsTaxRate

          withdrawal += additionalWithdrawal
          taxOnWithdrawal += additionalTax

          // Calculate covered amount
          const coveredAmount = additionalWithdrawal * (1 - person.retirementAssetsTaxRate)
          netCashFlow += coveredAmount
        } else {
          // We have enough assets to cover the shortfall
          withdrawal += ltcShortfallWithdrawal
          taxOnWithdrawal += ltcShortfallTax
          netCashFlow = 0 // Shortfall is fully covered
        }
      }
    }

    // Calculate the maximum loan-to-value ratio (default to 95% if not specified)
    const maxLoanToValueRatio = person.policyMaxLoanToValueRatio || 0.95

    // Calculate the maximum allowable loan based on the loan-to-value ratio
    const maxAllowableLoan = policyValue * maxLoanToValueRatio

    // Calculate available borrowing capacity
    const availableCashValue = Math.max(0, maxAllowableLoan - policyLoanBalance)

    // Handle cash shortfall
    if (netCashFlow < 0) {
      // First try to withdraw from retirement assets
      if (currentAssets > 0) {
        // Calculate how much we need to withdraw, including tax
        const shortfall = -netCashFlow
        const shortfallWithdrawal = shortfall / (1 - person.retirementAssetsTaxRate)
        const shortfallTax = shortfallWithdrawal * person.retirementAssetsTaxRate

        // Limit withdrawal to available assets
        if (shortfallWithdrawal + withdrawal > currentAssets) {
          const remainingAssets = Math.max(0, currentAssets - withdrawal)
          const additionalWithdrawal = remainingAssets
          const additionalTax = additionalWithdrawal * person.retirementAssetsTaxRate

          withdrawal += additionalWithdrawal
          taxOnWithdrawal += additionalTax

          // Calculate remaining shortfall after using all available assets
          const coveredAmount = additionalWithdrawal * (1 - person.retirementAssetsTaxRate)
          const remainingShortfall = shortfall - coveredAmount

          // Only now consider policy loans if assets are depleted
          if (
            remainingShortfall > 0 &&
            person.policyEnabled &&
            person.policyLoanEnabled &&
            isRetired &&
            policyValue > 0
          ) {
            // Calculate raw policy loan amount needed
            const rawPolicyLoanAmount = Math.min(remainingShortfall, availableCashValue)

            // Apply smoothing to policy loan amount to prevent oscillation
            if (age >= person.ltcEventAge + person.ltcDuration) {
              // Only apply smoothing after LTC event
              smoothedPolicyLoanAmount =
                smoothedPolicyLoanAmount * smoothingFactor + rawPolicyLoanAmount * (1 - smoothingFactor)
              policyLoanTaken = smoothedPolicyLoanAmount
            } else {
              policyLoanTaken = rawPolicyLoanAmount
            }

            // Update loan balance
            policyLoanBalance += policyLoanTaken

            // Mark that we've deviated from the illustration
            hasDeviatedFromIllustration = true
          }
        } else {
          // We have enough assets to cover the shortfall
          withdrawal += shortfallWithdrawal
          taxOnWithdrawal += shortfallTax
        }
      }
      // Only take policy loans if there are no retirement assets left
      else if (person.policyEnabled && person.policyLoanEnabled && isRetired && policyValue > 0) {
        // Calculate how much we need to borrow
        const shortfall = -netCashFlow

        // Calculate raw policy loan amount needed
        const rawPolicyLoanAmount = Math.min(shortfall, availableCashValue)

        // Apply smoothing to policy loan amount to prevent oscillation
        if (age >= person.ltcEventAge + person.ltcDuration) {
          // Only apply smoothing after LTC event
          // If this is the first year after LTC event, initialize the smoothed amount
          if (age === person.ltcEventAge + person.ltcDuration) {
            smoothedPolicyLoanAmount = rawPolicyLoanAmount
          } else {
            // Apply exponential smoothing formula
            smoothedPolicyLoanAmount =
              smoothedPolicyLoanAmount * smoothingFactor + rawPolicyLoanAmount * (1 - smoothingFactor)
          }
          policyLoanTaken = smoothedPolicyLoanAmount
        } else {
          policyLoanTaken = rawPolicyLoanAmount
        }

        // Update loan balance
        policyLoanBalance += policyLoanTaken

        // Mark that we've deviated from the illustration
        hasDeviatedFromIllustration = true
      }
    }

    // Handle premium payments from retirement assets if retired
    // Only apply this if the person is retired and has a policy
    if (isRetired && person.policyEnabled && premiumExpenses > 0) {
      // First try to pay premiums from retirement assets
      if (currentAssets > 0) {
        // Calculate the gross withdrawal needed to cover premium + tax
        premiumWithdrawal = premiumExpenses / (1 - person.retirementAssetsTaxRate)
        taxOnPremiumWithdrawal = premiumWithdrawal * person.retirementAssetsTaxRate

        // Limit withdrawal to available assets
        if (premiumWithdrawal + withdrawal > currentAssets) {
          const remainingAssets = Math.max(0, currentAssets - withdrawal)
          premiumWithdrawal = remainingAssets
          taxOnPremiumWithdrawal = premiumWithdrawal * person.retirementAssetsTaxRate

          // Calculate remaining premium after using all available assets
          const coveredAmount = premiumWithdrawal * (1 - person.retirementAssetsTaxRate)
          const remainingPremium = premiumExpenses - coveredAmount

          // Only now consider policy loans for remaining premium if assets are depleted
          if (remainingPremium > 0 && person.policyLoanEnabled && policyValue > 0) {
            // Calculate raw policy loan amount needed for premium
            const rawPremiumLoanAmount = Math.min(remainingPremium, availableCashValue - policyLoanTaken)

            // Apply smoothing to premium loan amount
            let premiumLoan = rawPremiumLoanAmount
            if (age >= person.ltcEventAge + person.ltcDuration) {
              // We'll use the same smoothing approach for premium loans
              premiumLoan = rawPremiumLoanAmount
            }

            // Add to policy loan taken this year
            policyLoanTaken += premiumLoan

            // Update loan balance
            policyLoanBalance += premiumLoan

            // Mark that we've deviated from the illustration
            hasDeviatedFromIllustration = true
          }
        }

        // Add these to the total withdrawal and tax
        withdrawal += premiumWithdrawal
        taxOnWithdrawal += taxOnPremiumWithdrawal

        // Adjust net cash flow to reflect that premiums are paid from assets, not income
        // This prevents double-counting the premium expense
        const premiumPaidFromAssets = Math.min(
          premiumExpenses,
          premiumWithdrawal * (1 - person.retirementAssetsTaxRate),
        )
        netCashFlow += premiumPaidFromAssets
      }
      // Only use policy loans for premiums if there are no retirement assets left
      else if (person.policyLoanEnabled && policyValue > 0) {
        // Calculate raw policy loan amount needed for premium
        const rawPremiumLoanAmount = Math.min(premiumExpenses, availableCashValue - policyLoanTaken)

        // Apply smoothing to premium loan amount
        let premiumLoan = rawPremiumLoanAmount
        if (age >= person.ltcEventAge + person.ltcDuration) {
          // We'll use the same smoothing approach for premium loans
          premiumLoan = rawPremiumLoanAmount
        }

        // Add to policy loan taken this year
        policyLoanTaken += premiumLoan

        // Update loan balance
        policyLoanBalance += premiumLoan

        // Mark that we've deviated from the illustration
        hasDeviatedFromIllustration = true
      }
    }

    // Update assets - Use different return rates for pre-retirement and retirement
    // FIX: Correct order of operations - apply interest first, then add savings
    let annualSavingsAmount = 0
    if (!isRetired) {
      // If there's an LTC event pre-retirement, we don't add annual savings
      annualSavingsAmount = hasLTCEvent ? 0 : person.annualSavings

      // FIX: First apply interest to existing assets, then add savings
      // Old incorrect calculation: currentAssets = (currentAssets + annualSavingsAmount - withdrawal) * (1 + person.preRetirementAssetReturns)
      if (year === 0) {
        // For the first year, don't apply interest - just subtract withdrawals and add savings
        currentAssets = currentAssets - withdrawal + annualSavingsAmount
      } else {
        // For subsequent years, apply interest to existing assets first, then add savings and subtract withdrawals
        currentAssets = (currentAssets - withdrawal) * (1 + person.preRetirementAssetReturns) + annualSavingsAmount
      }
    } else {
      // For retirement years, apply interest to existing assets after withdrawals
      // Old incorrect calculation: currentAssets = (currentAssets - withdrawal) * (1 + person.assetReturns)
      if (year === 0) {
        // For the first year, don't apply interest - just subtract withdrawals
        currentAssets = currentAssets - withdrawal
      } else {
        // For subsequent years, apply interest after withdrawals
        currentAssets = (currentAssets - withdrawal) * (1 + person.assetReturns)
      }
    }

    // Ensure assets don't go negative
    currentAssets = Math.max(0, currentAssets)

    // Adjust policy value and death benefit for policy loans
    if (policyLoanTaken > 0) {
      // Mark that we've deviated from the illustration
      hasDeviatedFromIllustration = true
    }

    // FIX: Only adjust the policy value for the NEW loan amount and interest, not the entire balance
    // This is the key fix for the bug
    if (policyLoanTaken > 0 || policyLoanInterest > 0) {
      // Reduce policy value by just the new loan and interest
      policyValue = Math.max(0, policyValue - policyLoanTaken - policyLoanInterest)

      // Reduce death benefit by just the new loan and interest
      deathBenefit = Math.max(0, deathBenefit - policyLoanTaken - policyLoanInterest)
    }

    // Store the adjusted values for next year's calculation
    previousPolicyValue = policyValue
    previousDeathBenefit = deathBenefit

    const totalAssets = currentAssets + policyValue

    // For hybrid policies, get the total LTC benefit
    if (isHybridPolicy && useActualPolicy && hasPolicyData) {
      totalLTCBenefit = getTotalLTCBenefitForAge(policyData, personIndex, age)
    }

    projection.push({
      age,
      year,
      policyYear, // Use the potentially shifted policy year
      income: totalIncome,
      workIncome,
      socialSecurityIncome,
      otherRetirementIncome,
      expenses: totalExpenses,
      basicExpenses,
      ltcExpenses,
      premiumExpenses,
      ltcBenefits,
      netCashFlow,
      withdrawal,
      taxOnWithdrawal,
      assets: currentAssets,
      policyValue,
      deathBenefit,
      totalAssets,
      cumulativeLTCBenefits,
      hasLTCEvent,
      isAlive: true,
      policyLoanTaken,
      policyLoanBalance,
      policyLoanInterest,
      appliedGrowthRate,
      originalPolicyValue,
      originalDeathBenefit,
      totalLTCBenefit,
    })
  }

  return projection
}

export function calculateHouseholdProjection(
  person1Projection: YearlyFinancialData[],
  person2Projection: YearlyFinancialData[],
): YearlyFinancialData[] {
  // Find the maximum projection length
  const maxLength = Math.max(person1Projection.length, person2Projection.length)

  const householdProjection: YearlyFinancialData[] = []

  for (let i = 0; i < maxLength; i++) {
    const p1Data = i < person1Projection.length ? person1Projection[i] : null
    const p2Data = i < person2Projection.length ? person2Projection[i] : null

    if (!p1Data && !p2Data) continue

    const year = p1Data ? p1Data.year : p2Data!.year

    const combinedData: YearlyFinancialData = {
      age: p1Data ? p1Data.age : p2Data ? p2Data.age : 0, // Use person1's age as reference point
      year,
      policyYear: 0, // Not applicable for household
      income: (p1Data?.income || 0) + (p2Data?.income || 0),
      workIncome: (p1Data?.workIncome || 0) + (p2Data?.workIncome || 0),
      socialSecurityIncome: (p1Data?.socialSecurityIncome || 0) + (p2Data?.socialSecurityIncome || 0),
      otherRetirementIncome: (p1Data?.otherRetirementIncome || 0) + (p2Data?.otherRetirementIncome || 0),
      expenses: (p1Data?.expenses || 0) + (p2Data?.expenses || 0),
      basicExpenses: (p1Data?.basicExpenses || 0) + (p2Data?.basicExpenses || 0),
      ltcExpenses: (p1Data?.ltcExpenses || 0) + (p2Data?.ltcExpenses || 0),
      premiumExpenses: (p1Data?.premiumExpenses || 0) + (p2Data?.premiumExpenses || 0),
      ltcBenefits: (p1Data?.ltcBenefits || 0) + (p2Data?.ltcBenefits || 0),
      netCashFlow: (p1Data?.netCashFlow || 0) + (p2Data?.netCashFlow || 0),
      withdrawal: (p1Data?.withdrawal || 0) + (p2Data?.withdrawal || 0),
      taxOnWithdrawal: (p1Data?.taxOnWithdrawal || 0) + (p2Data?.taxOnWithdrawal || 0), // Add tax on withdrawal
      assets: (p1Data?.assets || 0) + (p2Data?.assets || 0),
      policyValue: (p1Data?.policyValue || 0) + (p2Data?.policyValue || 0),
      deathBenefit: (p1Data?.deathBenefit || 0) + (p2Data?.deathBenefit || 0),
      totalAssets: (p1Data?.totalAssets || 0) + (p2Data?.totalAssets || 0),
      cumulativeLTCBenefits: (p1Data?.cumulativeLTCBenefits || 0) + (p2Data?.cumulativeLTCBenefits || 0),
      hasLTCEvent: p1Data?.hasLTCEvent || false || p2Data?.hasLTCEvent || false,
      isAlive: p1Data?.isAlive || false || p2Data?.isAlive || false,
      policyLoanTaken: (p1Data?.policyLoanTaken || 0) + (p2Data?.policyLoanTaken || 0),
      policyLoanBalance: (p1Data?.policyLoanBalance || 0) + (p2Data?.policyLoanBalance || 0),
      policyLoanInterest: (p1Data?.policyLoanInterest || 0) + (p2Data?.policyLoanInterest || 0),
      appliedGrowthRate: ((p1Data?.appliedGrowthRate || 0) + (p2Data?.appliedGrowthRate || 0)) / 2, // Average of both growth rates
      originalPolicyValue: (p1Data?.originalPolicyValue || 0) + (p2Data?.originalPolicyValue || 0),
      originalDeathBenefit: (p1Data?.originalDeathBenefit || 0) + (p2Data?.originalDeathBenefit || 0),
      totalLTCBenefit: (p1Data?.totalLTCBenefit || 0) + (p2Data?.totalLTCBenefit || 0),
    }

    householdProjection.push(combinedData)
  }

  return householdProjection
}
