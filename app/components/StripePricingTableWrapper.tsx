'use client';

import dynamic from 'next/dynamic';

// Dynamically import the StripePricingTable component with no SSR
const StripePricingTable = dynamic(
  () => import('./StripePricingTable'),
  { ssr: false }
);

export default function StripePricingTableWrapper() {
  return <StripePricingTable />;
} 