export function formatCurrency(value: number, compact = false): string {
  if (isNaN(value)) return "$0"

  if (compact) {
    // For mobile/compact display
    if (Math.abs(value) >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`
    } else if (Math.abs(value) >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`
    } else {
      return `$${Math.round(value)}`
    }
  }

  // Standard formatting
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatPercentage(value: number): string {
  if (isNaN(value)) return "0%"
  return `${(value * 100).toFixed(1)}%`
}
