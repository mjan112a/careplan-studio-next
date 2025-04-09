"use client"

import * as React from "react"
import type { PolicyData } from "../types/financial-types"
import * as originalPolicyData from "./policy-data"
import * as alternativePolicyData from "./policy-data2"

interface PolicyContextType {
  useAlternativeData: boolean
  togglePolicyData: () => void
  getCurrentPolicyData: () => {
    policyData1: PolicyData[]
    policyData2: PolicyData[]
  }
  setCustomPolicyData: (person1Data: PolicyData[], person2Data: PolicyData[]) => void
  hasCustomData: boolean
  resetToDefaultData: () => void
}

// Create the context with a default undefined value
const PolicyContext = React.createContext<PolicyContextType | undefined>(undefined)

// Create a provider component without using JSX
export function PolicyProvider(props: { children: React.ReactNode }) {
  const [useAlternativeData, setUseAlternativeData] = React.useState(false)
  const [customPolicyData, setCustomPolicyDataState] = React.useState<{
    policyData1: PolicyData[] | null
    policyData2: PolicyData[] | null
  }>({
    policyData1: null,
    policyData2: null,
  })

  const togglePolicyData = React.useCallback(() => {
    if (!customPolicyData.policyData1 && !customPolicyData.policyData2) {
      setUseAlternativeData((prev) => !prev)
    }
  }, [customPolicyData])

  const getCurrentPolicyData = React.useCallback(() => {
    if (customPolicyData.policyData1 && customPolicyData.policyData2) {
      return {
        policyData1: customPolicyData.policyData1,
        policyData2: customPolicyData.policyData2,
      }
    }
    return useAlternativeData ? alternativePolicyData : originalPolicyData
  }, [customPolicyData, useAlternativeData])

  const setCustomPolicyData = React.useCallback((person1Data: PolicyData[], person2Data: PolicyData[]) => {
    setCustomPolicyDataState({
      policyData1: person1Data,
      policyData2: person2Data,
    })
  }, [])

  const resetToDefaultData = React.useCallback(() => {
    setCustomPolicyDataState({
      policyData1: null,
      policyData2: null,
    })
    setUseAlternativeData(false)
  }, [])

  const hasCustomData = !!(customPolicyData.policyData1 && customPolicyData.policyData2)

  // Create the context value object
  const contextValue = React.useMemo(
    () => ({
      useAlternativeData,
      togglePolicyData,
      getCurrentPolicyData,
      setCustomPolicyData,
      hasCustomData,
      resetToDefaultData,
    }),
    [
      useAlternativeData,
      togglePolicyData,
      getCurrentPolicyData,
      setCustomPolicyData,
      hasCustomData,
      resetToDefaultData,
    ],
  )

  // Use createElement instead of JSX
  return React.createElement(PolicyContext.Provider, { value: contextValue }, props.children)
}

// Custom hook to use the context
export function usePolicyData() {
  const context = React.useContext(PolicyContext)
  if (context === undefined) {
    throw new Error("usePolicyData must be used within a PolicyProvider")
  }
  return context
}

