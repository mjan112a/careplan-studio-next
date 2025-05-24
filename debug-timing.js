// Debug script to analyze timing reconciliation issues
// Run this in the browser console or as a standalone script

function debugTimingReconciliation() {
  console.log("=== TIMING RECONCILIATION DEBUG ===");
  
  // Get debug data from localStorage (if available)
  const person1Data = localStorage.getItem("debug_person1");
  const person2Data = localStorage.getItem("debug_person2");
  
  if (!person1Data) {
    console.log("No debug data found. Please run the simulator first.");
    return;
  }
  
  const person1 = JSON.parse(person1Data);
  
  console.log("\n=== PERSON 1 TIMING ANALYSIS ===");
  console.log(`Current Age: ${person1.currentAge}`);
  console.log(`Policy Enabled: ${person1.policyEnabled}`);
  
  if (person1.policyData && person1.policyData.length > 0) {
    console.log("\n=== POLICY DATA STRUCTURE ===");
    console.log("First 10 years of policy data:");
    person1.policyData.slice(0, 10).forEach(policy => {
      console.log(`  Year ${policy.year}: Premium $${policy.premium}, Cash Value $${policy.cashValue}`);
    });
  }
  
  if (person1.retirementData && person1.retirementData.length > 0) {
    console.log("\n=== RETIREMENT DATA ANALYSIS ===");
    console.log("First 10 years of calculation data:");
    person1.retirementData.slice(0, 10).forEach((data, index) => {
      const yearsSinceStart = data.age - person1.currentAge;
      const expectedPolicyYear = yearsSinceStart + 1;
      console.log(`  Age ${data.age} (Year ${index + 1}, Policy Year ${expectedPolicyYear}): Premium $${data.policyPremium}, Cash Value $${data.policyCashValue}`);
    });
  }
  
  // Timing reconciliation analysis
  console.log("\n=== TIMING RECONCILIATION ANALYSIS ===");
  console.log("Expected mapping (Beginning-of-Year vs End-of-Year):");
  console.log("Age 60 (Year 1): Should pay Year 1 premium, have Year 0 cash value at start, Year 1 cash value at end");
  console.log("Age 61 (Year 2): Should pay Year 2 premium, have Year 1 cash value at start, Year 2 cash value at end");
  
  if (person1.retirementData && person1.policyData) {
    const discrepancies = [];
    person1.retirementData.slice(0, 5).forEach((data, index) => {
      const ageIndex = index;
      const policyYear = (data.age - person1.currentAge) + 1;
      const policyData = person1.policyData.find(p => p.year === policyYear);
      
      if (policyData) {
        if (data.policyPremium !== policyData.premium) {
          discrepancies.push({
            age: data.age,
            policyYear: policyYear,
            calculatedPremium: data.policyPremium,
            expectedPremium: policyData.premium,
            difference: data.policyPremium - policyData.premium
          });
        }
      }
    });
    
    if (discrepancies.length > 0) {
      console.log("\n=== DISCREPANCIES FOUND ===");
      discrepancies.forEach(disc => {
        console.log(`Age ${disc.age}: Expected $${disc.expectedPremium}, Got $${disc.calculatedPremium}, Diff: $${disc.difference}`);
      });
    } else {
      console.log("\n=== NO DISCREPANCIES FOUND ===");
    }
  }
}

// Auto-run if in browser environment
if (typeof window !== 'undefined') {
  // Wait a bit for data to be available
  setTimeout(debugTimingReconciliation, 1000);
} else {
  // Export for Node.js environment
  module.exports = { debugTimingReconciliation };
}