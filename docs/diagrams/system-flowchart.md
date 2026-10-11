# Overall system flow

The paid order is created by the verified Stripe webhook, after payment confirmation. The customer return page retrieves the Stripe session and is not the order-creation trigger.

```mermaid
flowchart TD
  Open[Open storefront] --> Browse[Browse / search / filter published catalog]
  Browse --> Detail[View product and choose color / size]
  Detail --> Cart[Add to browser-persisted cart]
  Cart --> Sign{Signed in?}
  Sign -- No --> Auth[Clerk sign-in]
  Auth --> Checkout[Submit checkout]
  Sign -- Yes --> Checkout
  Checkout --> Validate[Server loads current Sanity product data]
  Validate --> Valid{Products, quantity, stock, options valid?}
  Valid -- No --> Error[Show validation error; correct cart]
  Error --> Cart
  Valid -- Yes --> Session[Create Stripe Checkout Session]
  Session --> SessionOK{Session created?}
  SessionOK -- No --> CheckoutError[Show retryable checkout error]
  SessionOK -- Yes --> Stripe[Customer pays on Stripe hosted page]
  Stripe --> Event[Stripe sends signed completion event]
  Event --> Signature{Signature valid?}
  Signature -- No --> Reject[Return HTTP 400]
  Signature -- Yes --> Paid{Session status paid?}
  Paid -- No --> Skip[Skip order creation]
  Paid -- Yes --> Duplicate{Order already found by payment intent?}
  Duplicate -- Yes --> Existing[Reuse existing order; guard confirmation email]
  Duplicate -- No --> Order[Create Sanity order]
  Order --> Stock[Decrement product stock in Sanity transaction]
  Stock --> Email[Claim and send confirmation email]
  Existing --> Email
  Email --> Success[Customer can view order; success page retrieves own Stripe session]
  Browse --> AI[Optional AI product discovery via Groq + Sanity]
  Browse --> Pincode[Optional pincode check: validate / rate limit / Shiprocket]
  Customer[Signed-in customer] --> Orders[Read own orders from Sanity]
  Admin[Admin] --> Role{Clerk role is admin?}
  Role -- No --> Denied[403 / redirect]
  Role -- Yes --> AdminTasks[Manage product, banner, inventory, fulfillment]
  AdminTasks --> AdminAPI[Validate request; write Sanity draft / publish]
  AdminAPI --> Revalidate[Revalidate storefront paths]
  AdminTasks --> Status[Update fulfillment status]
  Status --> Notify[Record notification; attempt SMTP delivery]
```

**Caption:** Storefront, payment, customer-order, admin, AI, and delivery-check paths. A4 landscape; this is a relatively broad overview and may be split into customer and admin pages for larger text.
