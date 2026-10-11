# Software module diagram

Modules below are actual routes, components, and function modules; the project is primarily React/function based rather than a set of domain classes.

```mermaid
classDiagram
  class StorefrontPages["app/(app) pages"]
  class ProductUI["components/app catalog, cart, wishlist"]
  class CheckoutUI["CheckoutClient / CheckoutButton"]
  class CartStore["lib/store/cart-store.ts"]
  class WishlistAPI["/api/wishlist"]
  class CheckoutAction["lib/actions/checkout.ts"]
  class CustomerAction["lib/actions/customer.ts"]
  class StripeWebhook["/api/webhooks/stripe"]
  class AdminPages["app/(admin)/admin"]
  class AdminUI["components/admin"]
  class AdminContent["/api/admin/content"]
  class FulfillmentAPI["fulfillment-status route"]
  class NotificationAction["lib/actions/order-status-notifications.ts"]
  class Queries["lib/sanity/queries"]
  class SanityClient["sanity/lib/client.ts"]
  class AdminSanity["lib/sanity/admin-client.ts"]
  class Schemas["sanity/schemaTypes"]
  class ChatAPI["/api/chat"]
  class Agent["lib/ai/shopping-agent.ts"]
  class SearchTool["search-products tool"]
  class OrderTool["get-my-orders tool"]
  class PincodeAPI["/api/shipping/check-pincode"]
  class ShiprocketClient["lib/shiprocket.ts"]
  class Email["lib/email/order-confirmation.ts"]
  StorefrontPages --> ProductUI
  ProductUI --> Queries
  ProductUI --> CartStore
  ProductUI --> WishlistAPI
  CheckoutUI --> CheckoutAction
  CheckoutAction --> CustomerAction
  CheckoutAction --> Queries
  CheckoutAction --> StripeWebhook : Stripe session flow
  StripeWebhook --> SanityClient
  StripeWebhook --> Email
  AdminPages --> AdminUI
  AdminUI --> AdminContent
  AdminUI --> FulfillmentAPI
  AdminContent --> AdminSanity
  AdminContent --> Schemas : document shapes
  FulfillmentAPI --> NotificationAction
  NotificationAction --> AdminSanity
  NotificationAction --> Email
  ChatAPI --> Agent
  Agent --> SearchTool
  Agent --> OrderTool
  SearchTool --> Queries
  OrderTool --> Queries
  PincodeAPI --> ShiprocketClient
```

**Caption:** Major application modules and dependencies. The Stripe webhook is invoked asynchronously by Stripe, not directly by the checkout action. A4 landscape recommended.
