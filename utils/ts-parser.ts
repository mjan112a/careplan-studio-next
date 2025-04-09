import type { PolicyData } from "../types/financial-types"

/**
 * Parses TypeScript policy data into JavaScript objects
 */
export function parsePolicyData(tsCode: string): {
  person1Data: PolicyData[]
  person2Data: PolicyData[]
} {
  // Initialize empty arrays
  let person1Data: PolicyData[] = []
  let person2Data: PolicyData[] = []

  try {
    // Extract the policy data arrays from the TypeScript code
    const p1Match = tsCode.match(/export const policyData1[\s\S]*?=[\s\S]*?\[([\s\S]*?)\]/)
    const p2Match = tsCode.match(/export const policyData2[\s\S]*?=[\s\S]*?\[([\s\S]*?)\]/)

    if (!p1Match || !p2Match) {
      throw new Error("Could not find policyData1 or policyData2 arrays in the input")
    }

    // Function to parse a single policy data array
    const parseArray = (arrayContent: string): PolicyData[] => {
      // Split the content by object entries (each starting with '{')
      const entries = arrayContent.split(/\s*{\s*/).filter((entry) => entry.trim())

      return entries.map((entry) => {
        // Add the opening brace back
        entry = "{" + entry

        // Find the closing brace
        const lastBraceIndex = entry.lastIndexOf("}")
        if (lastBraceIndex === -1) {
          throw new Error("Invalid object format - missing closing brace")
        }

        // Extract just the object part
        entry = entry.substring(0, lastBraceIndex + 1)

        // Convert to valid JSON
        const jsonEntry = entry
          .replace(/(\w+):/g, '"$1":') // Convert property names to strings
          .replace(/,(\s*})/g, "$1") // Remove trailing commas

        try {
          return JSON.parse(jsonEntry)
        } catch (e) {
          console.error("Failed to parse entry:", entry)
          console.error("Converted to:", jsonEntry)
          throw new Error("Failed to parse policy data entry")
        }
      })
    }

    // Parse both arrays
    person1Data = parseArray(p1Match[1])
    person2Data = parseArray(p2Match[1])

    // Validate the data
    const validateData = (data: PolicyData[]) => {
      const requiredFields = [
        "year",
        "premium",
        "cashValue",
        "deathBenefit",
        "totalLTCBenefit",
        "aobMonthly",
        "cobMonthly",
      ]

      for (const entry of data) {
        for (const field of requiredFields) {
          if (!(field in entry)) {
            throw new Error(`Missing required field '${field}' in policy data`)
          }
        }
      }
    }

    validateData(person1Data)
    validateData(person2Data)

    return { person1Data, person2Data }
  } catch (error) {
    console.error("Error parsing policy data:", error)
    throw error
  }
}

