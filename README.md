# Kumar Collection

Kumar Collection is a Next.js storefront and administration system for clothing. The current catalog implementation is specifically scoped to **men’s ethnic wear**. Although the business context also mentions kids’ clothing, the active product/category queries, Sanity department options, banner selectors, and AI stylist currently expose men’s categories only; a kids’ catalog is not confirmed in the implementation.

## Contents

- [Overview](#overview)
- [Features and current scope](#features-and-current-scope)
- [Technology](#technology)
- [Architecture](#architecture)
- [Repository map](#repository-map)
- [Setup](#setup)
- [Environment variables](#environment-variables)
- [Data model](#data-model)
- [Authentication and authorization](#authentication-and-authorization)
- [Business workflows](#business-workflows)
- [Admin dashboard](#admin-dashboard)
- [API reference](#api-reference)
- [Payments, orders, and email](#payments-orders-and-email)
- [AI features](#ai-features)
- [Deployment](#deployment)
- [Validation and troubleshooting](#validation-and-troubleshooting)
- [Security and data integrity](#security-and-data-integrity)
- [System diagrams](#system-diagrams)
- [Known limitations](#known-limitations)
- [License and credits](#license-and-credits)

## Overview

The application combines a customer storefront, Sanity-backed catalog and order data, Clerk sign-in and admin role checks, Stripe Checkout, and an admin dashboard. Store pages use the Next.js App Router; UI components and client-side Zustand state support product selection, cart, wishlist, and shopping chat interactions. Server actions and route handlers communicate with Sanity and external providers.

The catalog queries constrain public browsing to men’s products in these categories: kurtas, kurta sets, sherwanis, ethnic wear, Nehru jackets, Indo-Western, wedding wear, festive wear, and ethnic accessories. Sanity stores images as image fields referencing Sanity assets. Product `size` and `colors` are arrays of options on a product; order items snapshot the selected size/color and price at purchase.

## Features and current scope

### Storefront

- Homepage category tiles, featured product carousel, and up to eight active ordered homepage banners.
- Catalog search, category selection, and filters for color, fabric, size, fit, pattern, price, stock, and sort order.
- Product detail pages with image galleries, description, clothing attributes, stock, and size/color selection.
- Cart state is held client-side with Zustand; checkout re-fetches product records from Sanity to validate current price, availability, and selected options.
- Customer wishlist is synchronized through Sanity-backed API operations for signed-in users.
- Customer order list and details are protected by Clerk middleware.
- Locate Us and policy information components are present.
- Responsive layouts and loading placeholders are implemented throughout the storefront.

### Admin and content

- Admin dashboard, inventory list/detail, orders list/detail, and banner management under `/admin`.
- Admin API operations create and edit product/banner drafts, publish or discard drafts, upload images, query orders, update fulfillment state, and retry recorded status-email attempts.
- Product/category/banner/order/customer/wishlist/order-status-notification schemas are registered in Sanity.
- The Sanity Studio is mounted at `/studio`; access protection for this path is not established by the Clerk protected-route matcher, so configure Studio access and Sanity permissions appropriately.

### Checkout and integrations

- Stripe Checkout sessions are created only for authenticated customers. Server-side validation uses current Sanity product records, rather than cart-submitted prices.
- Stripe webhook signature verification, paid-order persistence, duplicate-payment checks, stock decrement, and confirmation email handling are implemented.
- Order fulfillment status updates have a notification record/retry flow and SMTP email integration.
- AI shopping chat uses Groq through the Vercel AI SDK. Product search is available to guests; an order lookup tool is only added for authenticated users.
- Admin AI insights route is present and uses the AI provider.
- Shiprocket pincode serviceability checking is implemented with in-process token/result caching and request limiting.

## Technology

Versions below are from `package.json`; a caret means the declared version is a range. The lockfile resolves exact dependency versions.

| Technology | Declared version | Use |
| --- | --- | --- |
| Node.js | Not pinned in repository | Runtime for Next.js and scripts; use a current compatible Node LTS. |
| Next.js | `16.0.7` | App Router, server rendering, server actions, route handlers, image optimization. |
| React / React DOM | `19.2.3` | UI rendering. |
| TypeScript | `^5` | Application and schema types. |
| Sanity / next-sanity | `^4.20.3` / `^11.6.10` | CMS Studio, GROQ queries, documents, image assets. |
| Clerk | `^6.36.0` | Authentication, session protection, user metadata roles. |
| Stripe SDK | `^20.0.0` | Checkout session creation, payment API, webhook verification. |
| AI SDK / Groq provider | `^6.0.39` / `^3.0.10` | Streaming shopping agent and admin insight generation. |
| Nodemailer | `^10.0.16` | SMTP order confirmation and fulfillment-status email. |
| Zustand | `^5.0.9` | Client cart, wishlist/chat state. |
| Tailwind CSS | `^4` | Styling via PostCSS. |
| Biome | `2.2.0` | Lint/check and formatting scripts. |
| Zod | `^4.1.13` | Admin API input validation. |
| Vercel | Hosting target/configuration inferred from project context; no `vercel.json` is present | Deployment platform; Next.js can deploy directly. |

Other notable packages include Radix UI, Embla Carousel, `lucide-react`, `styled-components`, `next-themes`, and `react-markdown`.

## Architecture

The browser renders Next.js pages and client components. Server components and server actions fetch catalog data and perform checkout preparation. Client components maintain cart and chat interaction state. API route handlers expose webhook, wishlist, AI, delivery, and admin operations.

Sanity is the persistent content store. Public catalog reads use a published perspective. Server-side write clients handle wishlist/order writes, while the admin API uses a dedicated `SANITY_ADMIN_API_TOKEN`. Clerk middleware protects `/admin`, `/checkout`, `/orders`, and `/checkout/success`; `requireAdmin()` separately checks that the authenticated Clerk user has `publicMetadata.role === "admin"` for admin operations.

Stripe Checkout is created server-side. Stripe calls the public `/api/webhooks/stripe` endpoint after payment; the handler verifies the signature and writes the order to Sanity. SMTP sends customer emails. Groq powers AI requests. Shiprocket powers pincode serviceability checks. See the [architecture diagram](docs/diagrams/09-deployment-diagram.md) and [system flow](docs/diagrams/03-system-flowchart.md).

## Repository map

```text
app/
  (app)/                 Storefront, products, checkout, orders, wishlist
  (admin)/admin/         Admin dashboard, inventory, orders, banners
  api/                   Webhook, wishlist, AI, shipping, admin handlers
  sign-in/               Clerk sign-in page
  studio/                Embedded Sanity Studio
components/app/          Storefront components
components/admin/        Admin UI components
components/ui/           Shared UI primitives
lib/actions/             Checkout, customer, status-notification actions
lib/ai/                  Shopping agent and tool implementations
lib/auth/                Admin authorization helper
lib/email/               Email templates and SMTP sender
lib/sanity/              GROQ queries and admin Sanity client
lib/store/               Zustand cart, wishlist, and chat state
sanity/schemaTypes/      Sanity document schemas
sanity/lib/              Sanity clients, image and live helpers
sanity/structure.ts      Studio navigation structure
scripts/                 Catalog preparation/import/verification scripts
docs/diagrams/           Mermaid architecture and workflow diagrams
```

Important configuration files include `package.json`, `package-lock.json`, `next.config.ts`, `proxy.ts`, `sanity.config.ts`, `sanity.cli.ts`, and `tsconfig.json`.

## Setup

### Prerequisites

- A Node.js version compatible with Next.js 16 (Node.js 20.9 or later is a suitable baseline).
- npm (the repository includes `package-lock.json`).
- Access to the Sanity project and any integrations you intend to exercise locally.

### Install and run

```bash
npm ci
```

Create `.env.local` with the relevant values from [Environment variables](#environment-variables), then start development:

```bash
npm run dev
```

Other scripts defined in `package.json`:

```bash
npm run build
npm run start
npm run lint
npm run typecheck
npm run typegen
npm run sanity:seed-categories
```

The seed script writes category documents to Sanity; review its behavior and target dataset before running it. Catalog import/preparation/verification scripts are standalone `scripts/*.mjs` files and are not package scripts.

## Environment variables

Never commit `.env.local`. Public-prefixed values are bundled for browser use and must not contain secrets. Server-only credentials must be configured in the local server environment and deployment provider.

| Variable | Purpose | Required for | Exposure |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity project ID | Storefront and Studio | Public configuration |
| `NEXT_PUBLIC_SANITY_DATASET` | Dataset | Storefront and Studio | Public configuration |
| `NEXT_PUBLIC_SANITY_API_VERSION` | Sanity API version; defaults to `2025-12-05` | Optional override | Public configuration |
| `NEXT_PUBLIC_SANITY_ORG_ID` | Sanity CLI organization configuration | Optional CLI setup | Public configuration |
| `SANITY_API_WRITE_TOKEN` | Wishlist/order writes and project scripts | Writes/webhook and scripts | Server-only secret |
| `SANITY_ADMIN_API_TOKEN` | Admin content API operations and uploads | Admin management | Server-only; use a separately scoped token |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk frontend | Authentication | Public key |
| `CLERK_SECRET_KEY` | Clerk server SDK | Authentication | Server-only secret |
| `STRIPE_SECRET_KEY` | Stripe session/payment API | Checkout and webhook | Server-only secret |
| `STRIPE_WEBHOOK_SECRET` | Stripe signature verification | Webhook | Server-only secret |
| `GROQ_API_KEY` | Groq provider credentials | AI chat and admin insights | Server-only secret (provider SDK convention) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` | SMTP transport | Email | Server configuration |
| `SMTP_USER`, `SMTP_PASS` | SMTP authentication | Email | Server-only credentials |
| `SMTP_FROM_EMAIL` | Sender address | Email | Server configuration |
| `SITE_URL` | Absolute base URL for order links in emails | Email links/status notifications | Server configuration |
| `SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD` | Shiprocket authentication | Delivery check | Server-only credentials |
| `SHIPROCKET_PICKUP_PINCODE` | Origin pincode | Delivery check | Server configuration |
| `SHIPROCKET_SERVICEABILITY_WEIGHT_KG` | Representative parcel weight | Delivery check | Server configuration |
| `NEXT_PUBLIC_BASE_URL` | Checkout return URL override | Checkout | Public URL configuration |
| `NEXT_PUBLIC_TRACK_ORDER_URL` | External tracking link override | Store tracking link | Public URL configuration |
| `NEXT_PUBLIC_STORE_ADDRESS` | Store address display | Optional location content | Public content |
| `NEXT_PUBLIC_STORE_MAP_EMBED_URL` | Map embed URL | Optional location content | Public URL configuration |
| `NEXT_PUBLIC_STORE_DIRECTIONS_URL` | Directions link | Optional location content | Public URL configuration |

Clerk also requires the provider's configured application/domain settings. `.env.example` currently documents the SMTP, site URL, and Shiprocket names; the remaining names are referenced in source or required by provider setup. Do not paste real values into documentation or support logs.

## Data model

Sanity is document-oriented; the relationships below are references or embedded fields, not SQL foreign keys.

| Document | Main data and relationships |
| --- | --- |
| `product` | Name, slug, description, INR price, category reference, `gender`, fabric/fit/pattern, color and size arrays, image array, stock, featured flag. |
| `category` | Title, slug, department array, optional image. Product/category browsing is explicitly filtered to men’s categories. |
| `banner` | Image, copy, CTA, destination type, optional category/product reference or custom URL, active flag, display order. |
| `customer` | Email/name, Clerk user ID, Stripe customer ID, creation date. |
| `order` | Order number, embedded item array, total, payment and fulfillment status, customer reference and Clerk ID, contact/address snapshot, Stripe payment ID, creation date. Item entries reference products and store quantity, `priceAtPurchase`, color, and size. |
| `wishlist` | Clerk user ID and array of product references. |
| `orderStatusNotification` | Order reference, status transition, delivery state, attempts/timestamps, sanitized error code. |

Product and banner editing uses Sanity draft IDs (`drafts.<id>`) and an explicit publish operation. The admin API reads draft/published perspectives and promotes drafts on publish. Product deletion is refused when an order references the product, preserving historical references. Order item price and variant values are stored on the order so historical purchase details do not depend solely on current product fields. Sanity image assets are referenced by image fields and served from Sanity's CDN.

## Authentication and authorization

Clerk provides customer sign-in. Middleware (`proxy.ts`) requires a signed-in session for checkout, orders, order details, success, and the admin path. Authentication establishes who the user is; admin authorization is a separate role check.

`lib/auth/admin.ts` reads the Clerk user's **public metadata** and permits admin operations only when `publicMetadata.role` equals `admin`. Admin API routes call this helper. Assign the role through the Clerk dashboard/backend using a trusted administrator process; never accept a role from browser form data. Wishlist and order pages are authenticated customer experiences. The implementation should be reviewed for per-user ownership checks before exposing any customer-specific API behavior beyond the page flows documented here.

## Business workflows

1. **Discover:** homepage and category/product pages query published Sanity documents; list query predicates currently limit the catalog to the defined men's ethnic categories.
2. **Select:** product detail UI displays gallery, stock, sizes and colors. Cart state is local Zustand state.
3. **Checkout:** Clerk protects checkout. Server action verifies the user, reloads products from Sanity, checks stock/variant/quantities, derives prices from Sanity and creates a Stripe Checkout Session.
4. **Pay and persist:** Stripe posts an event to the webhook. Signature verification is required. For paid completion events, the handler checks for an existing order by payment ID, obtains Stripe line items and selected variants, creates a Sanity order, and decrements stock. The completion email is then attempted.
5. **Fulfill:** an admin updates fulfillment status. The implementation records notification attempts and supports retrying eligible failed/unknown notifications.
6. **Manage content:** an authorized admin creates product/banner drafts, uploads Sanity images, changes allowed fields, and publishes. Relevant Next.js paths are revalidated after mutations.
7. **Ask for help:** AI chat searches Sanity product data; signed-in sessions additionally receive the order lookup tool. The pincode checker calls Shiprocket serviceability APIs.

## Admin dashboard

| Page | Responsibility |
| --- | --- |
| `/admin` | Dashboard stats, recent orders, low-stock and AI insight components. |
| `/admin/inventory` | Inventory search/list and stock/product administration. |
| `/admin/inventory/[id]` | Product editing and publishing. |
| `/admin/orders` | Order search and status overview. |
| `/admin/orders/[id]` | Order detail, address editing, fulfillment status and notification history/actions. |
| `/admin/banners` | Homepage banner content, destination, ordering, active state, and image management. |

Pages are within the Clerk-protected `/admin` area; admin data APIs additionally enforce the metadata role. Image uploads go through the admin route to Sanity and are limited to image MIME types and 4 MB.

## API reference

Dynamic parameters are shown in braces. Admin endpoints require a Clerk session with `publicMetadata.role = "admin"`; webhook authentication uses Stripe signatures.

| Method | Endpoint | Purpose | Authentication / notes |
| --- | --- | --- | --- |
| `POST` | `/api/webhooks/stripe` | Process Stripe Checkout completion events and persist paid orders | Stripe signature required; raw request body verified. |
| `GET`, `POST`, `PUT` | `/api/admin/content` | Read/list/count documents; create, edit, publish/discard/delete; upload image | Admin role. JSON operations use `op`/`action`; `PUT` expects multipart `file`. |
| `POST` | `/api/admin/orders/{id}/fulfillment-status` | Update fulfillment status | Admin role. |
| `GET` | `/api/admin/orders/{id}/status-notifications` | Read the latest pending/failed/sending/unknown notification state | Admin role. |
| `POST` | `/api/admin/orders/{id}/status-notifications/{notificationId}/retry` | Retry a recorded notification | Admin role. |
| `PATCH` | `/api/admin/orders/{id}/fulfillment-status` | Validate and update an allowed fulfillment transition; sends/records email notification | Admin role; body includes `status` and `expectedStatus`. |
| `GET` | `/api/admin/insights` | Generate dashboard insights | Admin role. |
| `GET`, `POST` | `/api/wishlist` | Read or change signed-in user's saved products | Clerk session; Sanity write token needed for writes. |
| `POST` | `/api/chat` | Stream AI shopping agent response | Guest allowed; order tool only for authenticated user. |
| `POST` | `/api/shipping/check-pincode` | Check six-digit pincode serviceability | Public; in-memory rate limiting, returns availability and estimate or error. |

Checkout session creation and order-session retrieval are server actions rather than public REST endpoints.

## Payments, orders, and email

Checkout uses Stripe's hosted Checkout page in INR and collects a phone number plus shipping address. The server creates the session after validating product details against Sanity. The webhook handles `checkout.session.completed` and `checkout.session.async_payment_succeeded`; it verifies the Stripe signature, skips unpaid sessions, and checks the payment intent before creating a Sanity order. Payment ID lookup prevents duplicate order creation on webhook retries. The handler decrements product stock and attempts an order-confirmation email. If processing throws, it returns an error status so Stripe can retry.

SMTP is used for confirmation and fulfillment status mail. Notification delivery is tracked in Sanity, with retry support. Email sending depends on complete SMTP settings and a usable sender/site URL. A provider acceptance result is not proof of final inbox delivery.

## AI features

The customer shopping assistant is implemented as a Vercel AI SDK `ToolLoopAgent` using `@ai-sdk/groq` with model `openai/gpt-oss-120b`. Its `searchProducts` tool queries Sanity with category, color, fabric, gender, size, fit, pattern, price, and text filters. The prompt currently instructs the assistant to recommend men's ethnic clothing only. Signed-in users receive a `getMyOrders` tool; guests do not. `/api/admin/insights` is a separate admin-only insight endpoint. AI output depends on provider availability and catalog data and should not be treated as authoritative inventory reservation.

## Deployment

The repository is a Next.js application suitable for Vercel deployment; no `vercel.json` or separate worker/database infrastructure was found. Configure environment variables in the Vercel project settings, then deploy through the project's normal Vercel workflow. Set the production Clerk keys and allowed application origins, Sanity project/dataset and appropriately scoped write/admin tokens, Stripe secret and webhook signing secret, Groq API key, SMTP settings, and Shiprocket settings if those features are enabled.

Configure the Stripe webhook destination as `https://<production-host>/api/webhooks/stripe` for the handled Checkout events. Set `NEXT_PUBLIC_BASE_URL` to the canonical storefront URL if the default checkout URL is unsuitable. After deployment, verify public storefront pages, sign-in, role-gated admin, a test-mode Stripe checkout/webhook, mail configuration, AI requests, image delivery, and pincode checks without exposing credentials.

## Validation and troubleshooting

Available package scripts are listed in [Setup](#setup). The repository has standalone storefront/catalog verification scripts, but no dedicated automated test suite was identified. `scripts/verify-local-storefront.mjs` performs HTTP checks against a running storefront and updates a review markdown file; inspect its target URL and write behavior before executing it. `scripts/verify-kumar-storefront.mjs` queries Sanity and updates `generated-kumar-catalog-review.md`.

Practical manual checks: storefront/catalog images; Clerk sign-in and customer orders; admin role access; product draft/publish and stock; banner image/upload/destination; cart price and stock revalidation; Stripe test payment and webhook; order status email/retry; AI chat and admin insight; Shiprocket pincode result; production build and typecheck.

Common configuration checks: missing Sanity project/dataset prevents Sanity client setup; missing Stripe secrets prevents checkout/webhook initialization; missing admin Sanity token causes admin content operations to report service unavailable; incomplete SMTP settings prevent email; missing Shiprocket credentials/settings cause delivery checks to return a retryable unavailable response. Check provider dashboards and sanitized application errors; never print secret values.

## Security and data integrity

- Keep Sanity write/admin tokens, Clerk secret, Stripe secret/webhook secret, Groq key, SMTP credentials, and Shiprocket credentials server-side.
- Stripe webhook events are verified with the signature header and configured webhook secret.
- Checkout validates product price, stock, and options from Sanity rather than trusting client prices.
- Admin mutations are role-checked and validated with Zod/field allowlists; image upload validates MIME type and caps size at 4 MB.
- Product deletion checks for order references; orders embed purchase-time price and selected variants.
- The pincode limiter and Shiprocket cache are process-memory state, so they are not globally coordinated across serverless instances.

## System diagrams

All diagrams are editable Mermaid source files:

1. [Domain model](docs/diagrams/01-domain-class-diagram.md)
2. [Use cases](docs/diagrams/02-use-case-diagram.md)
3. [System flowchart](docs/diagrams/03-system-flowchart.md)
4. [Software modules](docs/diagrams/04-uml-class-diagram.md)
5. [Checkout and payment sequence](docs/diagrams/05-sequence-checkout-payment.md)
6. [Admin product and banner sequence](docs/diagrams/06-sequence-admin-product-banner.md)
7. [Order notification sequence](docs/diagrams/07-sequence-order-notification.md)
8. [Sanity document relationship diagram](docs/diagrams/08-er-diagram.md)
9. [Deployment topology](docs/diagrams/09-deployment-diagram.md)

## Known limitations

- The active catalog implementation is limited to men’s ethnic wear. Kids’ clothing is not represented in active department/category selectors and queries.
- Product variants are arrays of size/color options on a product, not independently stocked SKU documents; inventory is a product-level count.
- Cart state is browser-side; a durable server-side cart is not present.
- Delivery estimates and abuse controls use in-memory process state and therefore are not shared across Vercel instances.
- Email delivery relies on SMTP and records the integration's attempt/acceptance outcome, not final recipient inbox delivery.
- No formal automated test suite or root Node version pin was found.

Potential future work includes explicit kids' catalog support, per-variant inventory, and shared rate-limit/cache storage, if those align with business requirements.

## License and credits

`LICENSE.md` states Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0) and credits Sonny Sangha / PAPAFAM (copyright 2024). Review the license file for the full terms. The project also uses the libraries listed in `package.json`.
