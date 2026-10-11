import {
  BadgeCheck,
  HeartHandshake,
  LockKeyhole,
  RotateCcw,
} from "lucide-react";

const values = [
  {
    title: "Selected with care",
    description: "Traditional menswear for weddings, festivals and occasions.",
    Icon: HeartHandshake,
  },
  {
    title: "Quality assured",
    description: "Considered fabrics, finish and comfort for everyday wear.",
    Icon: BadgeCheck,
  },
  {
    title: "Secure payments",
    description: "Checkout payments are securely processed by Stripe.",
    Icon: LockKeyhole,
  },
  {
    title: "Easy returns",
    description: "Our team can help with eligible returns and exchanges.",
    Icon: RotateCcw,
  },
];

export function TrustValues() {
  return (
    <section
      aria-label="Kumar Collection values"
      className="border-y border-[#e5e2da] bg-white/70"
    >
      <div className="mx-auto grid max-w-[1320px] grid-cols-2 divide-x divide-y divide-[#e5e2da] px-5 sm:px-8 lg:grid-cols-4 lg:divide-y-0 lg:px-12">
        {values.map(({ title, description, Icon }) => (
          <article
            key={title}
            className="flex flex-col items-center px-3 py-7 text-center sm:px-6 sm:py-9"
          >
            <Icon
              aria-hidden="true"
              className="h-5 w-5 stroke-[1.4] text-zinc-700"
            />
            <h2 className="mt-3 text-[9px] font-semibold uppercase tracking-[0.19em] text-zinc-900 sm:text-[10px]">
              {title}
            </h2>
            <p className="mt-2 max-w-[15rem] text-[11px] leading-relaxed text-zinc-500 sm:text-xs">
              {description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
