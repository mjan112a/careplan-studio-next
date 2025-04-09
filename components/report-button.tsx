"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import type { Person, CombinedYearlyData } from "../types/financial-types"
import { generateReportData } from "../utils/report-generator"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { formatCurrency } from "../utils/calculation-utils"
import html2canvas from "html2canvas"

interface ReportButtonProps {
  person1: Person
  person2: Person
  combinedData: CombinedYearlyData[]
}

export default function ReportButton({ person1, person2, combinedData }: ReportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  // Create refs for the chart elements
  const incomeChartRef = useRef<HTMLDivElement>(null)
  const assetChartRef = useRef<HTMLDivElement>(null)
  const ltcChartRef = useRef<HTMLDivElement>(null)

  const captureChart = async (element: HTMLElement | null): Promise<string | null> => {
    if (!element) return null

    try {
      const canvas = await html2canvas(element, {
        scale: 2, // Higher scale for better quality
        logging: false,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      })

      return canvas.toDataURL("image/png")
    } catch (error) {
      console.error("Error capturing chart:", error)
      return null
    }
  }

  const generatePDF = async () => {
    setIsGenerating(true)

    try {
      // Generate the report data
      const reportData = generateReportData(person1, person2, combinedData)

      // Create a new PDF document
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      // Add title
      doc.setFontSize(20)
      doc.setTextColor(0, 0, 128)
      doc.text("Retirement & LTC Financial Analysis", 105, 20, { align: "center" })

      // Add date
      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text(`Generated on: ${reportData.generatedDate}`, 105, 27, { align: "center" })

      // Add divider
      doc.setDrawColor(200, 200, 200)
      doc.line(20, 30, 190, 30)

      let yPos = 40

      // Person 1 Section
      if (person1.enabled) {
        yPos = addPersonSection(doc, reportData.person1, 1, yPos)

        // Add page break if needed
        if (yPos > 250) {
          doc.addPage()
          yPos = 20
        }
      }

      // Person 2 Section
      if (person2.enabled) {
        yPos = addPersonSection(doc, reportData.person2, 2, yPos)

        // Add page break if needed
        if (yPos > 250) {
          doc.addPage()
          yPos = 20
        }
      }

      // Combined Section
      if (person1.enabled || person2.enabled) {
        yPos = addCombinedSection(doc, reportData.combined, yPos)
      }

      // Try to capture and add charts
      // Find chart elements in the DOM
      const chartElements = document.querySelectorAll(".recharts-wrapper")

      if (chartElements.length > 0) {
        doc.addPage()
        doc.setFontSize(16)
        doc.setTextColor(0, 0, 128)
        doc.text("Charts & Visualizations", 105, 20, { align: "center" })

        let chartYPos = 30

        // Process each chart
        for (let i = 0; i < Math.min(chartElements.length, 3); i++) {
          try {
            const chartElement = chartElements[i] as HTMLElement
            const chartImage = await captureChart(chartElement)

            if (chartImage) {
              // Add chart title based on index
              doc.setFontSize(12)
              doc.setTextColor(0, 0, 0)

              const titles = ["Income & Expenses Projection", "Asset Projection", "LTC Event Impact"]

              doc.text(titles[i], 20, chartYPos)
              chartYPos += 5

              // Add the chart image
              doc.addImage(chartImage, "PNG", 20, chartYPos, 170, 80)

              chartYPos += 90

              // Add page break if needed
              if (i < chartElements.length - 1 && chartYPos > 220) {
                doc.addPage()
                chartYPos = 20
              }
            }
          } catch (error) {
            console.error("Error adding chart to PDF:", error)
          }
        }
      }

      // Add disclaimer
      doc.addPage()
      addDisclaimer(doc)

      // Save the PDF
      doc.save("Retirement_LTC_Analysis.pdf")
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("An error occurred while generating the report. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button onClick={generatePDF} disabled={isGenerating} className="flex items-center gap-2">
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating Report...
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          Download Report
        </>
      )}
    </Button>
  )
}

// Helper function to add a person section to the PDF
const addPersonSection = (doc: jsPDF, personData: any, personNumber: number, startY: number) => {
  let yPos = startY

  // Add person header
  doc.setFontSize(16)
  doc.setTextColor(0, 0, 128)
  doc.text(`${personData.name} Analysis`, 20, yPos)
  yPos += 10

  // Add policy status
  doc.setFontSize(12)
  // Fix: Use separate setTextColor calls for each parameter
  if (personData.policyEnabled) {
    doc.setTextColor(0, 128, 0)
  } else {
    doc.setTextColor(128, 0, 0)
  }
  doc.text(`Policy Status: ${personData.policyEnabled ? "Enabled" : "Disabled"}`, 20, yPos)
  yPos += 10

  // Add key ages
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text("Key Ages:", 20, yPos)
  yPos += 6

  doc.setFontSize(10)
  doc.text(`Current Age: ${personData.keyAges.currentAge}`, 25, yPos)
  yPos += 5
  doc.text(`Retirement Age: ${personData.keyAges.retirementAge}`, 25, yPos)
  yPos += 5

  if (personData.keyAges.ltcEventAge) {
    doc.text(`LTC Event Age: ${personData.keyAges.ltcEventAge}`, 25, yPos)
    yPos += 5
  }

  if (personData.keyAges.bankruptAge) {
    doc.setTextColor(128, 0, 0)
    doc.text(`Assets Depleted Age: ${personData.keyAges.bankruptAge}`, 25, yPos)
    doc.setTextColor(0, 0, 0)
    yPos += 5
  }

  yPos += 5

  // Add retirement summary
  doc.setFontSize(12)
  doc.text("Retirement Summary:", 20, yPos)
  yPos += 8

  // Create retirement summary table
  autoTable(doc, {
    startY: yPos,
    head: [["Metric", "Value"]],
    body: [
      ["Annual Income Needed at Retirement", formatCurrency(personData.retirementSummary.incomeNeeded)],
      ["Social Security", formatCurrency(personData.retirementSummary.socialSecurity)],
      ["Pension", formatCurrency(personData.retirementSummary.pension)],
      ["Income Gap", formatCurrency(personData.retirementSummary.incomeGap)],
      ["Assets at Retirement", formatCurrency(personData.retirementSummary.assetsAtRetirement)],
      ["Final Assets (With Policy)", formatCurrency(personData.retirementSummary.finalAssets)],
      ["Final Assets (Without Policy)", formatCurrency(personData.retirementSummary.finalAssetsNoPolicyScenario)],
      ["Policy Impact", formatCurrency(personData.retirementSummary.policyImpact)],
    ],
    theme: "grid",
    styles: { fontSize: 10 },
    columnStyles: { 0: { cellWidth: 80 } },
    margin: { left: 25 },
  })

  yPos = (doc as any).lastAutoTable.finalY + 10

  // Add LTC summary if applicable
  if (personData.ltcSummary) {
    doc.setFontSize(12)
    doc.text("Long-Term Care Summary:", 20, yPos)
    yPos += 8

    // Create LTC summary table
    autoTable(doc, {
      startY: yPos,
      head: [["Metric", "Value"]],
      body: [
        ["LTC Event Age", personData.ltcSummary.ltcEventAge],
        ["LTC Duration (Years)", personData.ltcSummary.ltcDuration],
        ["Monthly LTC Need", formatCurrency(personData.ltcSummary.ltcMonthlyNeed)],
        ["Annual LTC Cost", formatCurrency(personData.ltcSummary.ltcAnnualCost)],
        ["LTC Benefits", formatCurrency(personData.ltcSummary.ltcBenefits)],
        ["Out-of-Pocket Expenses", formatCurrency(personData.ltcSummary.ltcOutOfPocket)],
        ["Coverage Ratio", `${personData.ltcSummary.coverageRatio}%`],
        ["Total LTC Costs", formatCurrency(personData.ltcSummary.totalLtcNeeded)],
        ["Total LTC Coverage", formatCurrency(personData.ltcSummary.totalLtcCovered)],
        ["Total Coverage Ratio", `${personData.ltcSummary.totalCoverageRatio}%`],
      ],
      theme: "grid",
      styles: { fontSize: 10 },
      columnStyles: { 0: { cellWidth: 80 } },
      margin: { left: 25 },
    })

    yPos = (doc as any).lastAutoTable.finalY + 10
  }

  // Add asset summary
  doc.setFontSize(12)
  doc.text("Asset Summary:", 20, yPos)
  yPos += 8

  // Create asset summary table
  autoTable(doc, {
    startY: yPos,
    head: [["Metric", "Value"]],
    body: [
      ["Current 401(k) Balance", formatCurrency(personData.assetSummary.currentAssets)],
      ["Annual Contribution", formatCurrency(personData.assetSummary.annualContribution)],
      ["Asset Return Rate", `${personData.assetSummary.assetReturnRate}%`],
      ["Retirement Return Rate", `${personData.assetSummary.retirementReturnRate}%`],
      ["Assets at Retirement", formatCurrency(personData.assetSummary.assetsAtRetirement)],
      ["Final 401(k) Assets", formatCurrency(personData.assetSummary.finalAssets)],
      ["Final 401(k) Assets (No Policy)", formatCurrency(personData.assetSummary.finalAssetsNoPolicyScenario)],
      ["Total Policy Premium", formatCurrency(personData.assetSummary.totalPolicyPremium)],
      ["Final Policy Cash Value", formatCurrency(personData.assetSummary.finalPolicyCashValue)],
      ["Final Policy Death Benefit", formatCurrency(personData.assetSummary.finalPolicyDeathBenefit)],
      ["Death Age", personData.assetSummary.deathAge],
      ["Death Benefit to Heirs", formatCurrency(personData.assetSummary.legacyAmount)],
      ["Retirement Assets at Death", formatCurrency(personData.assetSummary.assetsAtDeath)],
      ["Total to Heirs", formatCurrency(personData.assetSummary.totalToHeirs)],
    ],
    theme: "grid",
    styles: { fontSize: 10 },
    columnStyles: { 0: { cellWidth: 80 } },
    margin: { left: 25 },
  })

  yPos = (doc as any).lastAutoTable.finalY + 15

  return yPos
}

// Helper function to add the combined section to the PDF
const addCombinedSection = (doc: jsPDF, combinedData: any, startY: number) => {
  let yPos = startY

  // Add combined header
  doc.setFontSize(16)
  doc.setTextColor(0, 0, 128)
  doc.text("Combined Household Analysis", 20, yPos)
  yPos += 10

  // Add key ages
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text("Key Ages:", 20, yPos)
  yPos += 6

  doc.setFontSize(10)
  doc.text(`Start Age: ${combinedData.keyAges.startAge}`, 25, yPos)
  yPos += 5
  doc.text(`End Age: ${combinedData.keyAges.endAge}`, 25, yPos)
  yPos += 5

  if (combinedData.keyAges.bankruptAge) {
    doc.setTextColor(128, 0, 0)
    doc.text(`Assets Depleted Age: ${combinedData.keyAges.bankruptAge}`, 25, yPos)
    doc.setTextColor(0, 0, 0)
    yPos += 5
  }

  yPos += 5

  // Add retirement summary
  doc.setFontSize(12)
  doc.text("Combined Retirement Summary:", 20, yPos)
  yPos += 8

  // Create retirement summary table
  autoTable(doc, {
    startY: yPos,
    head: [["Metric", "Value"]],
    body: [
      ["Earliest Retirement Age", combinedData.retirementSummary.earliestRetirementAge],
      ["Combined Income Needed", formatCurrency(combinedData.retirementSummary.incomeNeeded)],
      ["Combined Social Security", formatCurrency(combinedData.retirementSummary.socialSecurity)],
      ["Combined Pension", formatCurrency(combinedData.retirementSummary.pension)],
      ["Combined Income Gap", formatCurrency(combinedData.retirementSummary.incomeGap)],
      ["Combined Assets at Retirement", formatCurrency(combinedData.retirementSummary.assetsAtRetirement)],
      ["Final Combined Assets (With Policy)", formatCurrency(combinedData.retirementSummary.finalAssets)],
      [
        "Final Combined Assets (Without Policy)",
        formatCurrency(combinedData.retirementSummary.finalAssetsNoPolicyScenario),
      ],
      ["Combined Policy Impact", formatCurrency(combinedData.retirementSummary.policyImpact)],
    ],
    theme: "grid",
    styles: { fontSize: 10 },
    columnStyles: { 0: { cellWidth: 80 } },
    margin: { left: 25 },
  })

  yPos = (doc as any).lastAutoTable.finalY + 10

  // Add LTC summary if applicable
  if (combinedData.ltcSummary) {
    doc.setFontSize(12)
    doc.text("Combined Long-Term Care Summary:", 20, yPos)
    yPos += 8

    // Create LTC summary table
    autoTable(doc, {
      startY: yPos,
      head: [["Metric", "Value"]],
      body: [
        ["Total LTC Costs", formatCurrency(combinedData.ltcSummary.totalLtcCosts)],
        ["Total LTC Benefits", formatCurrency(combinedData.ltcSummary.totalLtcBenefits)],
        ["Total Out-of-Pocket Expenses", formatCurrency(combinedData.ltcSummary.totalLtcOutOfPocket)],
        ["Total Coverage Ratio", `${combinedData.ltcSummary.totalCoverageRatio}%`],
      ],
      theme: "grid",
      styles: { fontSize: 10 },
      columnStyles: { 0: { cellWidth: 80 } },
      margin: { left: 25 },
    })

    yPos = (doc as any).lastAutoTable.finalY + 10
  }

  // Add asset summary
  doc.setFontSize(12)
  doc.text("Combined Asset Summary:", 20, yPos)
  yPos += 8

  // Create asset summary table
  autoTable(doc, {
    startY: yPos,
    head: [["Metric", "Value"]],
    body: [
      ["Combined Current 401(k) Balance", formatCurrency(combinedData.assetSummary.totalCurrentAssets)],
      ["Combined Annual Contribution", formatCurrency(combinedData.assetSummary.totalAnnualContribution)],
      ["Combined Assets at Retirement", formatCurrency(combinedData.assetSummary.assetsAtRetirement)],
      ["Final Combined 401(k) Assets", formatCurrency(combinedData.assetSummary.finalAssets)],
      [
        "Final Combined 401(k) Assets (No Policy)",
        formatCurrency(combinedData.assetSummary.finalAssetsNoPolicyScenario),
      ],
      ["Total Combined Policy Premium", formatCurrency(combinedData.assetSummary.totalPolicyPremium)],
      ["Final Combined Policy Cash Value", formatCurrency(combinedData.assetSummary.finalPolicyCashValue)],
      ["Final Combined Policy Death Benefit", formatCurrency(combinedData.assetSummary.finalPolicyDeathBenefit)],
    ],
    theme: "grid",
    styles: { fontSize: 10 },
    columnStyles: { 0: { cellWidth: 80 } },
    margin: { left: 25 },
  })

  yPos = (doc as any).lastAutoTable.finalY + 15

  return yPos
}

// Helper function to add disclaimer to the PDF
const addDisclaimer = (doc: jsPDF) => {
  doc.setFontSize(14)
  doc.setTextColor(0, 0, 128)
  doc.text("Important Disclaimer", 105, 20, { align: "center" })

  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)

  const disclaimer = [
    "This report is for informational purposes only and does not constitute financial advice.",
    "",
    "The projections shown in this report are based on the assumptions you provided and general economic assumptions. Actual results may vary significantly based on market conditions, inflation rates, policy changes, and other factors beyond our control.",
    "",
    "The long-term care costs are estimates based on current costs and projected inflation rates. Actual long-term care costs may be higher or lower depending on various factors including location, level of care needed, and future inflation rates.",
    "",
    "Policy benefits shown are based on the policy details you provided. Actual policy benefits may differ. Please refer to your policy documents for exact coverage details.",
    "",
    "We recommend consulting with a qualified financial advisor before making any financial decisions based on this report.",
    "",
    "This report does not account for taxes, which can significantly impact your retirement income and assets.",
  ]

  let yPos = 40
  disclaimer.forEach((line) => {
    doc.text(line, 20, yPos)
    yPos += line === "" ? 5 : 7
  })
}

