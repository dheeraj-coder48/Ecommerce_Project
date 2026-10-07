# Kumar Collection

Kumar Collection is a men's traditional and ethnicwear ecommerce website. Its catalog is focused on garments such as kurtas, kurta sets, Nehru jackets, sherwanis, and related men's ethnicwear. The application uses Sanity for catalog and order content, Clerk for customer authentication, Stripe Checkout for card payments, and Shiprocket for delivery serviceability checks.

## Overview

The Next.js storefront lets customers browse and filter the Sanity catalog, select available colors and sizes, save products to a signed-in wishlist, maintain a browser-persisted cart, check delivery availability by Indian pincode, and complete checkout. Signed-in customers can view their orders and ask the shopping assistant about products or their own order history.

The `/admin` area provides dashboard, inventory, order, and homepage banner screens backed by Sanity. Sanity Studio is also embedded at `/studio`.

## Customer Features

- Homepage category tiles, active Sanity banners, and a featured-product carousel.
- Product catalog with text search, category, size, fabric, color, fit, pattern, price-range, and in-stock filters. Sorting includes featured, newest, price ascending/descending, and relevance.
- Product detail pages with an image gallery and enlarged image viewer, product information, available color and size choices, stock information, add-to-cart, and wishlist controls.
- Cart stored in browser local storage through Zustand. Cart lines distinguish product/color/size combinations; checkout revalidates product prices, selected variants, and stock against Sanity.
- Clerk-authenticated checkout and order history, including order detail pages.
- Responsive layouts, loading states, toast feedback, and light/dark theme support.
- Store location and policy information in the storefront footer and dialogs.

## Product & Catalog

Products and categories are Sanity documents. Product fields include name, slug, description, INR price, category, men's department, fabric, colors, sizes, fit, pattern, images, stock, and featured status. The product schema requires a name, slug, category, and at least one image. Categories have a title, slug, men's department assignment, and optional image.

Color and size are product-level choices, not separately inventoried SKU documents. Stock is checked and decremented at product level. The storefront's catalog queries and category selections are oriented toward men's ethnicwear.

## Wishlist

Wishlist data is stored persistently in Sanity, in one `wishlist` document per Clerk user. Customers must be signed in to load or change it. The API derives the document ID from a hash of the Clerk user ID and stores references to saved products; the client store holds the currently loaded view and is not the persistence layer. The wishlist page and product-card/detail controls use this API. A Sanity write token is required for wishlist changes.

## AI Features

The customer shopping assistant is available through the chat interface and `/api/chat`. It uses the Vercel AI SDK with the Groq provider and the `openai/gpt-oss-120b` model. Its product search tool queries Sanity and can filter by query, category, fabric, color, department, size, fit, pattern, and INR price range. For signed-in users, a separate tool can retrieve that user's orders and statuses. The order tool is omitted for guests; it does not provide guest access to order records.

The admin dashboard also requests generated store insights from `/api/admin/insights`, using store/order data and the same Groq model. The route and page exist in the codebase; configure `GROQ_API_KEY` to use AI requests.

## Delivery & Shipping

The product page delivery checker posts a six-digit Indian pincode to `POST /api/shipping/check-pincode`. The server authenticates with Shiprocket using server-only credentials, checks courier serviceability from the configured pickup pincode using a representative configured shipment weight, and returns availability plus an estimated delivery date or duration when Shiprocket provides one.

The Shiprocket helper caches authentication tokens and serviceability results in process memory; serviceability entries live for 10 minutes. The route also applies an in-memory limit of 30 requests per client address per five-minute window. These in-memory controls are local to a running application instance. Configure `SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD`, `SHIPROCKET_PICKUP_PINCODE`, and `SHIPROCKET_SERVICEABILITY_WEIGHT_KG`; credentials and tokens must remain server-side.

## Payments & Checkout

Checkout is created by the `createCheckoutSession` server action using Stripe Checkout. The configured payment method is **card**. Stripe collects the customer's phone number and shipping address during checkout; payment card details are handled by Stripe and are not stored in Sanity by this application. The success page retrieves the Checkout Session for display.

`POST /api/webhooks/stripe` verifies Stripe's signature and handles `checkout.session.completed`. It uses an idempotency check to avoid creating duplicate orders, writes paid order and customer data to Sanity, and decrements product stock. Local webhook development can use the Stripe CLI to forward events to this route. Set the webhook signing secret in `STRIPE_WEBHOOK_SECRET`.

## Authentication

Clerk is provided to the storefront. The `proxy.ts` Clerk middleware protects `/checkout`, `/checkout/success`, and `/orders` (including order details). Wishlist API requests also check the Clerk user on the server. The visible admin screens are Sanity App SDK interfaces; the admin layout does not implement a Clerk role-based access check, so access to Sanity and its project must be configured appropriately.

## Admin Panel

The `/admin` dashboard includes store statistics, recent orders, low-stock information, AI insights, and a create-product entry point. `/admin/inventory` lists products and supports creating and editing product documents, image upload, publishing controls, featured status, inventory, and product deletion. `/admin/orders` lists and filters orders; order details support order-status and address editing. `/admin/banners` supports homepage banner creation, editing, ordering/activation, and deletion, with destinations for categories, products, or custom links.

The Sanity schemas define `product`, `category`, `banner`, `order`, `customer`, and `wishlist` document types. Categories can be maintained in Sanity Studio; there is no separate category-management page under `/admin`.

## CMS / Sanity

Sanity is the content store for catalog, categories, banners, customers, orders, and wishlists. GROQ queries live in `lib/sanity/queries/`. The embedded Studio is available at `/studio`; its structure and schema are configured in `sanity/` and `sanity.config.ts`. The application uses `next-sanity` clients and a `SanityLive` provider, while admin screens use `@sanity/sdk` and `@sanity/sdk-react` for document interactions. A server-side write client is used for mutations such as wishlist persistence and Stripe webhook order/stock updates.

Generated Sanity types are in `sanity.types.ts`; `npm run typegen` extracts the schema and regenerates them.

## Tech Stack

Versions below are the versions/ranges declared in `package.json`.

| Area | Technologies |
| --- | --- |
| Application | Next.js `16.0.7`, React / React DOM `19.2.3`, TypeScript `^5` |
| Styling and UI | Tailwind CSS `^4`, Radix UI primitives, shadcn-style local UI components, Lucide icons, Sonner |
| CMS | Sanity `^4.20.3`, `next-sanity` `^11.6.10`, Sanity SDK and SDK React `^2.3.1` |
| Authentication | Clerk Next.js `^6.36.0` |
| Payments | Stripe Node SDK `^20.0.0` |
| Shipping | Shiprocket external API, called by the server-side integration |
| AI | Vercel AI SDK `^6.0.39`, AI SDK React `^3.0.39`, Groq provider `^3.0.10` |
| Client state and validation | Zustand `^5.0.9`, Zod `^4.1.13` |
| Code quality | Biome `2.2.0` |

## Project Structure

```text
app/
  (app)/                 Storefront, products, wishlist, checkout, and orders
  (admin)/admin/         Dashboard, inventory, orders, and banners
  api/                   Chat, admin insights, shipping, wishlist, and Stripe webhook
  studio/                Embedded Sanity Studio route
components/
  app/                   Storefront, product, cart, chat, and delivery UI
  admin/                 Admin dashboard and management components
  providers/             Application and Sanity providers
  ui/                    Shared UI primitives
lib/
  actions/               Checkout and customer server actions
  ai/                    Shopping agent and tools
  constants/             Store, filter, location, and order constants
  sanity/queries/        GROQ queries for catalog, orders, and dashboard data
  store/                 Zustand cart, wishlist, and chat state
  hooks/                 Storefront hooks
sanity/
  schemaTypes/           Product, category, banner, order, customer, wishlist schemas
  lib/                   Sanity client, live data, and image helpers
scripts/                 Catalog preparation/import/verification and category seeding
public/                   Static assets and category images
```

## Environment Variables

Create `.env.local` in the project root. Never commit it or put secret values in documentation. `.env.example` currently lists the four Shiprocket settings; the application also reads the variables below. Values shown here are placeholders, not real credentials.

| Variable | Required when | Exposure |
| --- | --- | --- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Using Sanity-backed pages and Studio | Public configuration |
| `NEXT_PUBLIC_SANITY_DATASET` | Using Sanity-backed pages and Studio | Public configuration |
| `NEXT_PUBLIC_SANITY_API_VERSION` | Optional; defaults in `sanity/env.ts` | Public configuration |
| `NEXT_PUBLIC_SANITY_ORG_ID` | Optional; enables Sanity CLI app organization configuration | Public configuration |
| `SANITY_API_WRITE_TOKEN` | Wishlist writes, webhook mutations, and catalog scripts | **Server-only secret** |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk authentication | Public configuration |
| `CLERK_SECRET_KEY` | Clerk server authentication | **Server-only secret** |
| `STRIPE_SECRET_KEY` | Checkout session creation and webhook handling | **Server-only secret** |
| `STRIPE_WEBHOOK_SECRET` | Verifying Stripe webhook signatures | **Server-only secret** |
| `GROQ_API_KEY` | Customer AI chat and admin AI insights | **Server-only secret** |
| `SHIPROCKET_EMAIL` | Delivery serviceability checks | **Server-only credential** |
| `SHIPROCKET_PASSWORD` | Delivery serviceability checks | **Server-only credential** |
| `SHIPROCKET_PICKUP_PINCODE` | Delivery serviceability checks | Server configuration; six-digit origin pincode |
| `SHIPROCKET_SERVICEABILITY_WEIGHT_KG` | Delivery serviceability checks | Server configuration; representative weight in kg |
| `NEXT_PUBLIC_BASE_URL` | Optional checkout URL override; otherwise Vercel URL or localhost is used | Public URL configuration |
| `NEXT_PUBLIC_TRACK_ORDER_URL` | Optional external tracking link override | Public URL configuration |
| `NEXT_PUBLIC_STORE_ADDRESS` | Optional store-location display | Public content configuration |
| `NEXT_PUBLIC_STORE_DIRECTIONS_URL` | Optional store directions link | Public URL configuration |
| `NEXT_PUBLIC_STORE_MAP_EMBED_URL` | Optional store map embed | Public URL configuration |
| `STOREFRONT_URL` | Optional target used by the local storefront verification script | Public URL configuration |

The `NEXT_PUBLIC_` prefix makes a value available to browser code. Never place credentials, API keys, or tokens in a `NEXT_PUBLIC_` variable. For example:

```dotenv
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_WRITE_TOKEN=your_sanity_write_token
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
GROQ_API_KEY=your_groq_api_key
SHIPROCKET_EMAIL=your_shiprocket_email
SHIPROCKET_PASSWORD=your_shiprocket_password
SHIPROCKET_PICKUP_PINCODE=your_six_digit_pickup_pincode
SHIPROCKET_SERVICEABILITY_WEIGHT_KG=0.5
```

## Local Development Setup

1. Install a Node.js version compatible with Next.js 16 and install dependencies with `npm install`.
2. Create `.env.local` with the variables required for the integrations you want to run. Sanity project ID and dataset are needed for Sanity content; Clerk, Stripe, Groq, and Shiprocket each need their corresponding configuration for those features.
3. Configure Sanity project access, dataset, and CORS for your local origin. Create a write token for server-side mutations and scripts.
4. Configure Clerk keys for the application. Use Stripe test credentials and configure a local webhook forwarder if testing completed orders.
5. Start the application with `npm run dev` and open `http://localhost:3000`. Sanity Studio is at `/studio`.

The category seeding script is available as `npm run sanity:seed-categories`. Other catalog preparation, import, and verification utilities are individual scripts in `scripts/`; they are not package scripts. Review each script and its prerequisites before running catalog writes.

## Running the Project

Commands below come from `package.json`:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Next.js development server with webpack |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run Biome checks |
| `npm run format` | Format files with Biome (writes formatting changes) |
| `npm run typecheck` | Run TypeScript without emitting files |
| `npm run typegen` | Extract Sanity schema and generate required-field-aware types |
| `npm run sanity:seed-categories` | Run the category seeding script |

For a production build, run `npm run build`, then `npm run start` in the configured deployment environment.

## Important API Routes

| Route | Purpose |
| --- | --- |
| `POST /api/chat` | Stream the AI shopping assistant response |
| `GET /api/admin/insights` | Generate dashboard insights from store data |
| `GET /api/wishlist` | Load the signed-in user's wishlist |
| `POST /api/wishlist` | Add a product to the signed-in user's wishlist |
| `DELETE /api/wishlist` | Remove a product from the signed-in user's wishlist |
| `POST /api/shipping/check-pincode` | Check Shiprocket serviceability and estimate |
| `POST /api/webhooks/stripe` | Verify Stripe webhook and process completed checkout sessions |

## Important Notes / Architecture

- Sanity is the application content store; there is no separate application database in this project.
- The browser cart is persisted locally. Wishlist and order records are persisted in Sanity.
- Stripe is configured for card payments only. Payment processing and card data entry happen in Stripe Checkout.
- Shiprocket credentials are used only in the server-side shipping helper. Rate limiting and delivery caching use process memory.
- Admin document operations use Sanity SDK integrations. Configure Sanity project permissions for administrators; the admin route layout itself does not add a Clerk admin-role check.
- Generated types are committed in `sanity.types.ts`; regenerate them after schema changes.

## Deployment

Deploy the Next.js application to a compatible Node.js hosting platform and configure the required environment variables in that platform's server environment. Also configure Sanity dataset access and allowed origins, Clerk production keys and application origins, Stripe production keys and a webhook endpoint at `/api/webhooks/stripe`, Groq access for AI features, and Shiprocket credentials/settings for delivery checks. Set `NEXT_PUBLIC_BASE_URL` when the checkout return URL needs an explicit canonical origin.

## License

See [LICENSE.md](./LICENSE.md) for the license terms.
