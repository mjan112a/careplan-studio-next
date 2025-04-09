import FinancialSimulator from "../../financial-simulator"
import AuthWrapper from "@/components/auth-wrapper"

export default function SimulatorPage() {
  return (
    <AuthWrapper>
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-4">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-blue-600">CarePlan Studio</h1>
            <a href="/" className="text-blue-600 hover:text-blue-800 transition">
              ← Back to Home
            </a>
          </div>
          <FinancialSimulator />
        </div>
      </main>
    </AuthWrapper>
  )
}

