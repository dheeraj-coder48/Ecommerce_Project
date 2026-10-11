"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

export type PolicyType = "faq" | "shipping" | "returns" | "terms" | "privacy";

const policyTitles: Record<PolicyType, string> = {
  faq: "FAQs",
  shipping: "Shipping Details",
  returns: "Return, Exchange and Refund Policy",
  terms: "Terms of Use",
  privacy: "Privacy Policy",
};

const faqs = [
  [
    "What products does Kumar Collection offer?",
    "Kumar Collection offers traditional and contemporary men's ethnic wear, including kurtas, kurta sets, sherwanis, Nehru jackets and occasion wear for weddings and festivals.",
  ],
  [
    "How can I place an order?",
    "Browse the collection, select a product and its available size or colour options, add it to your bag, then continue through checkout.",
  ],
  [
    "How can I check my order status?",
    "Use Track Order in the footer and enter the details requested by the external order-tracking service once tracking information is available.",
  ],
  [
    "Can I change my size or colour after placing an order?",
    "An order may be changed only before it enters processing and subject to availability. Please contact us through the on-site chat as soon as possible; a change cannot be guaranteed.",
  ],
  [
    "How do I contact Kumar Collection?",
    "Use the chat assistant available on this website for help with common shopping and order questions. For order details, sign in and visit Orders.",
  ],
  [
    "Do all products have the same fit?",
    "Fit and available sizes can vary by product. Review the size options and garment details on the product page before ordering.",
  ],
];

function PolicyBody({ type }: { type: PolicyType }) {
  if (type === "faq") {
    return (
      <div className="divide-y divide-[#e9e6df]">
        {faqs.map(([question, answer]) => (
          <details key={question} className="group py-4 first:pt-0">
            <summary className="cursor-pointer list-none pr-6 text-sm font-medium text-zinc-900 marker:hidden [&::-webkit-details-marker]:hidden">
              {question}
              <span
                aria-hidden="true"
                className="float-right text-zinc-400 group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-3 text-sm leading-7 text-zinc-600">{answer}</p>
          </details>
        ))}
      </div>
    );
  }

  const sections: Record<Exclude<PolicyType, "faq">, [string, string][]> = {
    shipping: [
      [
        "Order processing",
        "Orders are processed after successful order confirmation. Processing may take longer during busy periods or holidays.",
      ],
      [
        "Delivery",
        "Delivery time depends on your location and the delivery service available for your order. Any estimate shown during checkout is indicative.",
      ],
      [
        "Shipping charges",
        "Applicable shipping charges, if any, are displayed during checkout before you place your order.",
      ],
      [
        "Delivery updates",
        "When tracking information is available, use Track Order in the footer to visit our external tracking service.",
      ],
      [
        "Delays",
        "Weather, courier issues, holidays and other circumstances outside the store's control may affect delivery.",
      ],
    ],
    returns: [
      [
        "Return eligibility",
        "A product may be considered for return within the applicable return window shown for the order or product, subject to its eligibility and condition.",
      ],
      [
        "Product condition",
        "Items should be unused and unworn, with original tags and packaging retained where applicable.",
      ],
      [
        "Exchanges",
        "An exchange depends on the availability of the requested size or replacement product.",
      ],
      [
        "Damaged or incorrect items",
        "Please contact us promptly through the on-site chat if your order arrives damaged or contains the wrong product. Include your order details so we can review the issue.",
      ],
      [
        "Refunds and exclusions",
        "Approved refunds are processed to the original payment method, subject to the payment provider's processing. Certain products may be non-returnable where applicable; product or order details will take precedence.",
      ],
    ],
    terms: [
      [
        "Using this website",
        "Use the website lawfully and provide accurate information when placing an order or using an account.",
      ],
      [
        "Products, prices and availability",
        "We aim to present product descriptions, images, prices and availability accurately. Details and availability can change, and a displayed item may become unavailable.",
      ],
      [
        "Orders and payment",
        "Submitting an order is a request to purchase. Orders are subject to confirmation and availability. Payments are handled through the payment options shown at checkout.",
      ],
      [
        "Your account",
        "You are responsible for keeping your sign-in credentials secure and for activity carried out through your account.",
      ],
      [
        "Content and changes",
        "Website text, images, branding and other content belong to Kumar Collection or its respective owners. We may update website content or these general terms from time to time.",
      ],
      [
        "Responsibility and support",
        "The website and product information are provided for shopping purposes. To the extent permitted by applicable law, Kumar Collection is not responsible for interruptions or circumstances beyond its reasonable control. Contact us through the on-site chat for assistance.",
      ],
    ],
    privacy: [
      [
        "Information used for accounts and orders",
        "When you sign in or place an order, the service uses account and order details such as your identity and contact information, delivery details, items purchased and order status to operate your account and fulfil the order.",
      ],
      [
        "Authentication and payments",
        "Clerk provides sign-in and account authentication. Checkout payments are processed by Stripe; payment card details are handled by Stripe and are not stored in the store's product catalogue.",
      ],
      [
        "Website functionality",
        "The site uses information needed to maintain shopping functionality, including your bag during a shopping session, product selections and order records.",
      ],
      [
        "Communications and service providers",
        "Account and order details may be used to provide order updates and customer assistance. Service providers used to operate the site, authentication, content and payments process information needed for their services.",
      ],
      [
        "Security and your choices",
        "Reasonable safeguards are used to protect information, though no online service can promise absolute security. You can review your account and order information while signed in and ask for help through the on-site chat.",
      ],
      [
        "Updates",
        "This notice may be updated as the website or its services change. The current version will be shown here.",
      ],
    ],
  };

  return (
    <div className="space-y-6">
      {sections[type].map(([heading, body]) => (
        <section key={heading}>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-900">
            {heading}
          </h3>
          <p className="mt-2 text-sm leading-7 text-zinc-600">{body}</p>
        </section>
      ))}
    </div>
  );
}

export function PolicyModal({
  open,
  onOpenChange,
  type,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: PolicyType | null;
}) {
  const selectedType = type ?? "faq";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(82dvh,48rem)] max-w-[min(92vw,42rem)] flex-col gap-0 overflow-hidden rounded-none border-[#e5e2da] bg-[#fdfcf9] p-0 text-zinc-950 shadow-xl">
        <header className="shrink-0 border-b border-[#e5e2da] px-6 py-6 sm:px-9">
          <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
            Our policies
          </p>
          <DialogTitle className="mt-2 max-w-[90%] font-serif text-2xl font-normal leading-tight sm:text-3xl">
            {policyTitles[selectedType]}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Kumar Collection {policyTitles[selectedType]} information
          </DialogDescription>
        </header>
        <div className="overflow-y-auto px-6 py-6 sm:px-9 sm:py-8">
          <PolicyBody type={selectedType} />
        </div>
        <footer className="shrink-0 border-t border-[#e5e2da] px-6 py-4 text-right sm:px-9">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-700 hover:text-zinc-950"
          >
            Close
          </button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
