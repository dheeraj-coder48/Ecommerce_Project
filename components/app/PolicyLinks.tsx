"use client";

import { useState } from "react";
import { PolicyModal, type PolicyType } from "@/components/app/PolicyModal";

const links: { label: string; type: PolicyType }[] = [
  { label: "FAQs", type: "faq" },
  { label: "Shipping Details", type: "shipping" },
  { label: "Return, Exchange and Refund Policy", type: "returns" },
  { label: "Terms of Use", type: "terms" },
  { label: "Privacy Policy", type: "privacy" },
];

export function PolicyLinks() {
  const [activePolicy, setActivePolicy] = useState<PolicyType | null>(null);

  return (
    <>
      <ul className="mt-3 space-y-2 text-sm leading-5 text-white/85">
        {links.map(({ label, type }) => (
          <li key={type}>
            <button
              type="button"
              onClick={() => setActivePolicy(type)}
              className="cursor-pointer text-left leading-5 hover:text-white"
            >
              {label}
            </button>
          </li>
        ))}
      </ul>
      <PolicyModal
        open={activePolicy !== null}
        type={activePolicy}
        onOpenChange={(open) => {
          if (!open) setActivePolicy(null);
        }}
      />
    </>
  );
}
