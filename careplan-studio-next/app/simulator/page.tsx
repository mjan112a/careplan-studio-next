import { useState, useEffect } from "react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import PersonForm from "@/components/person-form"
import { AssetProjectionChart } from "@/components/asset-projection-chart"
import { IncomeExpenseChart } from "@/components/income-expense-chart"
import { PolicyDetails } from "@/components/policy-details"
import { PolicyBenefitsChart } from "@/components/policy-benefits-chart"
import { AIAnalysis } from "@/components/ai-analysis"
import { Documentation } from "@/components/documentation"
import { type Person, defaultPerson } from "@/types/person"
import { calculateFinancialProjection, calculateHouseholdProjection } from "@/utils/financial-calculations"
import { formatCurrency } from "@/utils/format"
import { getSamplePolicyData } from "@/types/policy-data"
import { PolicyDataDebug } from "@/components/policy-data-debug"
import { ThemeToggle } from "@/components/theme-toggle"
import { PolicyLoanChart } from "@/components/policy-loan-chart"
import { CustomGuidedTour, WelcomeModal } from "@/components/custom-guided-tour"
import { HelpCircle, RotateCcw } from "lucide-react"

// ... existing code ...

  // Handle data reset
  const handleResetData = () => {
    if (typeof window !== 'undefined') {
      // Clear the cached policy data
      window._customPolicyData = undefined;
      
      // Reload the page to fetch fresh data
      window.location.reload();
    }
  }

  // ... existing code continues ...

          {/* Add embellishment toggle if we have incomplete policy data */}
          {policyData && policyData.some(policy => policy._incomplete) && (
            <div className="flex items-center space-x-2">
              <Switch id="useEmbellishment" checked={useEmbellishment} onCheckedChange={setUseEmbellishment} />
              <Label htmlFor="useEmbellishment" className="flex items-center">
                Enhance Policy Data
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 ml-1 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Fills in missing policy data fields with sample values for better simulation.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
            </div>
          )}

          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleResetData}
            title="Reset Policy Data"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>

          <ThemeToggle />
</rewritten_file> 