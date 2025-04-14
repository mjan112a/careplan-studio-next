'use client';

import Link from "next/link";
import dynamic from 'next/dynamic';

// Dynamically import the StripePricingTableWrapperIsolated component with no SSR
const StripePricingTableWrapperIsolated = dynamic(
  () => import('./StripePricingTableWrapperIsolated'),
  { ssr: false }
);

export default function PricingSection() {
  return (
    <section id="pricing" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">Choose the plan that fits your practice</p>
        </div>

        {/* Stripe Pricing Table */}
        <div className="max-w-5xl mx-auto">
          <StripePricingTableWrapperIsolated />
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600">
            Need a custom enterprise solution?{" "}
            <Link href="/contact" className="text-blue-600 font-medium">
              Contact our sales team
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
} 