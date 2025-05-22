interface CustomDualAxisProps {
  x: number
  y: number
  width: number
  height: number
  stroke: string
  payload: {
    value: number
  }
  person1StartAge: number
  person2StartAge: number
}

export const CustomDualAxis = (props: CustomDualAxisProps) => {
  const { x, y, width, height, stroke, payload, person1StartAge, person2StartAge } = props

  // Add null checks to handle undefined payload
  if (!payload || payload.value === undefined) {
    return null // Return null if payload or payload.value is undefined
  }

  // The payload.value is the "years out" value
  const yearsOut = payload.value

  // Calculate Person 1 and Person 2 ages at this point
  const person1Age = person1StartAge + yearsOut
  const person2Age = person2StartAge + yearsOut

  return (
    <g transform={`translate(${x},${y})`}>
      {/* Years Out (top row) */}
      <text x={0} y={0} dy={16} textAnchor="middle" fill="#666" fontSize={12}>
        Year {yearsOut}
      </text>
      {/* Person 1 Age (middle row) */}
      <text x={0} y={0} dy={32} textAnchor="middle" fill="#3b82f6" fontSize={12}>
        P1: {person1Age}
      </text>
      {/* Person 2 Age (bottom row) */}
      <text x={0} y={0} dy={48} textAnchor="middle" fill="#ec4899" fontSize={12}>
        P2: {person2Age}
      </text>
    </g>
  )
}
