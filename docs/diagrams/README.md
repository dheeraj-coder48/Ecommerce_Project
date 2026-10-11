# Kumar Collection diagrams

These Mermaid source files describe the repository implementation inspected on 10 October 2026. They are editable text, and the timeline is a retrospective estimate rather than a verified work log.

| Diagram | Report section | Print suggestion |
|---|---|---|
| [Development Gantt chart](gantt-chart.md) | Project planning / methodology | A4 landscape |
| [Domain class diagram](domain-class-diagram.md) | System analysis / domain model | A4 landscape |
| [Use case diagram](use-case-diagram.md) | Requirements / functional scope | A4 landscape |
| [System flowchart](system-flowchart.md) | System design / process flow | A4 landscape |
| [Software module diagram](uml-class-diagram.md) | System architecture | A4 landscape |
| [Checkout and payment sequence](sequence-checkout-payment.md) | Detailed design / checkout | A4 landscape |
| [Admin product and banner sequence](sequence-admin-product-banner.md) | Detailed design / administration | A4 landscape |
| [Order status and notification sequence](sequence-order-status-notification.md) | Detailed design / notifications | A4 landscape |
| [Sanity document relationship diagram](sanity-er-diagram.md) | Data model / database design | A4 landscape |
| [Deployment diagram](deployment-diagram.md) | Deployment architecture | A4 landscape |

## Rendering

Use a Mermaid-capable Markdown preview, or export an individual diagram with Mermaid CLI (`mmdc`) to SVG or PNG. For example, copy the fenced Mermaid block into `diagram.mmd`, then run `mmdc -i diagram.mmd -o diagram.svg`. Print SVG for crisp lines; check the exported page before claiming a particular fit. A4 landscape is a starting recommendation, and dense diagrams may need A3 or a split across pages.

## Scope notes

The storefront currently queries men's ethnic wear. The product schema includes colors and sizes as arrays, not a separate persisted variant document. The cart is browser-local; customer wishlists and commerce records are Sanity documents. No deployment manifest was present in the inspected repository; Vercel is represented as the configured hosting target used by project configuration and deployment-related environment variables, not as proof of a live production deployment.
