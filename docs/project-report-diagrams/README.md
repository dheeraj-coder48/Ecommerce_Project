# Kumar Collection report diagrams

This folder contains print-ready figures for the Microsoft Word report and editable Mermaid sources. The figures document repository behavior; no production state or credentials are represented. The Gantt is a retrospective estimate, not a verified work log.

## Insert in report order

Insert each image at the matching report section. Use a Word section break before and after landscape pages; keep the figure caption below the image as editable Word text.

| Section | Image(s), in order | Orientation | Suggested caption |
|---|---|---|---|
| 2.2 | `images/gantt-chart.png` | A4 landscape | Figure 2.2. Retrospective estimated development schedule for Kumar Collection, 8 August–10 October 2026. |
| 2.3 | `images/domain-class-diagram.png`, then `images/domain-class-catalog-view.png` | A4 landscape | Figure 2.3(a). Commerce domain objects. Figure 2.3(b). Catalog and content domain objects. |
| 3.1 | `images/use-case-customer.png`, then `images/use-case-admin.png` | A4 landscape | Figure 3.1(a). Customer use cases. Figure 3.1(b). Administrator use cases. |
| 3.2 | `images/system-flowchart-part-1.png` through `images/system-flowchart-part-4.png` | A4 portrait | Figure 3.2(a–d). Storefront/checkout, payment/order processing, customer/supporting flows, and administration (Parts 1–4 of 4). |
| 3.3 | `images/software-class-diagram-part-1.png`, then `images/software-class-diagram-part-2.png` | A4 landscape | Figure 3.3(a). Storefront and commerce modules (Part 1 of 2). Figure 3.3(b). Administration and integrations (Part 2 of 2). |
| 3.4 | `images/sequence-checkout-payment.png`; `images/sequence-admin-product-banner.png`; `images/sequence-order-status-notification.png` | A4 landscape, one page each | Figure 3.4(a). Checkout and payment sequence. Figure 3.4(b). Admin product and banner management sequence. Figure 3.4(c). Order status notification sequence. |
| 3.5 | `images/activity-checkout.png`, then `images/activity-payment.png` | A4 portrait | Figure 3.5(a). Shopping and checkout activity (Part 1 of 2). Figure 3.5(b). Payment and order processing activity (Part 2 of 2). |
| 3.6 | `images/sanity-er-diagram.png`, then `images/sanity-er-cms.png` | A4 landscape | Figure 3.6(a). Core commerce Sanity document relationships. Figure 3.6(b). Catalog and CMS document relationships. |
| 3.7 | `images/deployment-diagram.png` | A4 landscape | Figure 3.7. Configured application hosting and external service boundaries. |

## Word page setup

- Use A4 paper. For landscape figures, insert **Layout → Breaks → Next Page** before the figure and again after it; set that section to **Layout → Orientation → Landscape**, then restore Portrait in the next section.
- Use approximately 1.5 cm margins on landscape figure pages and 2 cm on portrait pages. Set the image width to the available text width (typically 26.7 cm landscape or 17 cm portrait with these margins), keep **Lock aspect ratio** enabled, and use **In line with text** wrapping.
- Keep each image and its caption together using a one-cell borderless table or Word's paragraph “Keep with next” setting. Captions remain normal Word text and are not part of the image.
- Never resize by dragging only one edge. Change width with aspect ratio locked; do not squeeze a landscape figure onto a portrait page.
- PNG files are rendered with a 3508-pixel maximum dimension, which provides approximately 300-DPI-equivalent detail when sized to the corresponding A4 page width or height. SVG companions are available in `images/svg/` for Word versions with SVG support.

## Sources and regeneration

`source/` contains the editable Mermaid source used for each figure. To regenerate the PNG and SVG set, install Mermaid CLI (`npm install --global @mermaid-js/mermaid-cli`) and run from this folder:

```powershell
node render-diagrams.mjs
```

The renderer uses the Mermaid CLI executable and its Puppeteer renderer. If Chrome is not downloaded with Puppeteer, set `CHROME_PATH` to a Chrome/Chromium executable. Each source is exported as an SVG and as a high-resolution PNG with a maximum side of 3508 pixels. The renderer uses local files only.

## Repository evidence and limitations

- The browser cart is local persisted Zustand state; the signed-in wishlist and commerce records are Sanity documents.
- Products have size/color option arrays and product-level stock; no separate variant document was found.
- The customer catalog is scoped to men's ethnic wear. A stock filter in the supplied use-case text is not shown as a storefront filter.
- Order creation and stock decrement occur in the Stripe webhook after a paid event. The success page retrieves session details for display and does not create the order.
- Fulfillment status email delivery is logged; uncertain SMTP outcomes are marked unknown and require review.
- Shiprocket pincode limiting and delivery-result caching use process memory, not a globally coordinated store.
- The repository supports Vercel deployment configuration, but configuration does not prove a current production deployment is live.
- The three Section 3.4 sequence diagrams are the only primary sequence diagrams. Split views elsewhere are explicitly numbered in their captions and filenames.
