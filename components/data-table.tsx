"use client"

import React from "react"
import { formatCurrency } from "../utils/calculation-utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface DataTableProps {
  data: any[]
  prefix: string
  fields: { key: string; label: string }[]
  startAge?: number
  combinedView?: boolean
  person1Age?: number
  person2Age?: number
}

export default function DataTable({
  data,
  prefix,
  fields,
  startAge,
  combinedView = false,
  person1Age,
  person2Age,
}: DataTableProps) {
  // For combined view, we need to show both individual and combined metrics
  const renderCombinedHeaders = () => {
    return (
      <TableRow>
        <TableHead className="w-20">Year</TableHead>
        <TableHead className="w-20">P1 Age</TableHead>
        <TableHead className="w-20">P2 Age</TableHead>
        {fields.map((field) => (
          <React.Fragment key={field.key}>
            <TableHead>P1 {field.label}</TableHead>
            <TableHead>P2 {field.label}</TableHead>
            <TableHead>Combined {field.label}</TableHead>
          </React.Fragment>
        ))}
      </TableRow>
    )
  }

  // For individual view, we just show the regular headers
  const renderIndividualHeaders = () => {
    return (
      <TableRow>
        <TableHead className="w-20">Age</TableHead>
        <TableHead className="w-20">Year</TableHead>
        {fields.map((field) => (
          <TableHead key={field.key}>{field.label}</TableHead>
        ))}
      </TableRow>
    )
  }

  // For combined view, we need to show both individual and combined metrics
  const renderCombinedRow = (item: any, index: number) => {
    // Calculate the actual year number (1-based)
    const yearNumber = index + 1

    // Get the ages directly from the data point
    const p1Age = person1Age ? person1Age + index : "-"
    const p2Age = person2Age ? person2Age + index : "-"

    return (
      <TableRow key={index}>
        <TableCell className="font-medium">{yearNumber}</TableCell>
        <TableCell className="font-medium">{p1Age}</TableCell>
        <TableCell className="font-medium">{p2Age}</TableCell>
        {fields.map((field, fieldIndex) => (
          <React.Fragment key={`field-${fieldIndex}`}>
            <TableCell>
              {typeof item[`p1_${field.key}`] === "boolean"
                ? item[`p1_${field.key}`]
                  ? "Yes"
                  : "No"
                : formatCurrency(item[`p1_${field.key}`] || 0)}
            </TableCell>
            <TableCell>
              {typeof item[`p2_${field.key}`] === "boolean"
                ? item[`p2_${field.key}`]
                  ? "Yes"
                  : "No"
                : formatCurrency(item[`p2_${field.key}`] || 0)}
            </TableCell>
            <TableCell>
              {typeof item[`combined_${field.key}`] === "boolean"
                ? item[`combined_${field.key}`]
                  ? "Yes"
                  : "No"
                : formatCurrency(item[`combined_${field.key}`] || 0)}
            </TableCell>
          </React.Fragment>
        ))}
      </TableRow>
    )
  }

  // For individual view, we just show the regular row
  const renderIndividualRow = (item: any, index: number) => {
    return (
      <TableRow key={index}>
        <TableCell className="font-medium">{item.age}</TableCell>
        <TableCell className="font-medium">{startAge ? item.age - startAge + 1 : index + 1}</TableCell>
        {fields.map((field) => (
          <TableCell key={field.key}>
            {typeof item[`${prefix}${field.key}`] === "boolean"
              ? item[`${prefix}${field.key}`]
                ? "Yes"
                : "No"
              : formatCurrency(item[`${prefix}${field.key}`] || 0)}
          </TableCell>
        ))}
      </TableRow>
    )
  }

  return (
    <div className="max-h-[400px] overflow-auto border rounded-md">
      <Table>
        <TableHeader className="sticky top-0 bg-white">
          {combinedView ? renderCombinedHeaders() : renderIndividualHeaders()}
        </TableHeader>
        <TableBody>
          {data.map((item, index) =>
            combinedView ? renderCombinedRow(item, index) : renderIndividualRow(item, index),
          )}
        </TableBody>
      </Table>
    </div>
  )
}

