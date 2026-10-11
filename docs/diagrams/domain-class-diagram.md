# Domain model

Persisted Sanity documents are shown as documents. Order items and addresses are embedded values; cart state is browser storage. There is no separate product-variant entity.

```mermaid
classDiagram
  class Product["Sanity product document"] {
    _id
    name
    slug
    price INR
    stock integer
    gender
    fabric
    colors[]
    size[]
    fit
    pattern
    featured
  }
  class Category["Sanity category document"] { _id title slug departments[] }
  class Customer["Sanity customer document"] { _id email name clerkUserId stripeCustomerId }
  class Order["Sanity order document"] { _id orderNumber total status paymentStatus fulfillmentStatus stripePaymentId clerkUserId email customerPhone createdAt }
  class OrderItem["Embedded order item"] { quantity priceAtPurchase color size }
  class Address["Embedded address"] { name line1 line2 city postcode country }
  class Wishlist["Sanity wishlist document"] { _id clerkUserId updatedAt }
  class Banner["Sanity banner document"] { _id title subtitle ctaText active displayOrder destinationType customUrl }
  class Notification["Sanity notification document"] { _id fromStatus toStatus deliveryStatus attemptCount lastAttemptAt sentAt }
  class Cart["Browser Zustand persisted state"] { productId quantity color size price }
  class ImageAsset["Sanity image asset"] { _id url }
  Category "1" <-- "0..*" Product : category reference
  Order "1" *-- "1..*" OrderItem : embedded items
  OrderItem "0..*" --> "1" Product : product reference
  Order "0..*" --> "0..1" Customer : customer reference
  Order "1" *-- "0..1" Address : embedded address
  Wishlist "0..*" --> "0..*" Product : item references
  Notification "0..*" --> "1" Order : order reference
  Banner "0..*" --> "0..1" Category : optional destination
  Banner "0..*" --> "0..1" Product : optional destination
  Product "0..*" --> "0..*" ImageAsset : image references
  Category "0..*" --> "0..1" ImageAsset : image
  Banner "0..*" --> "1" ImageAsset : image
  Cart ..> Product : productId snapshot
```

**Caption:** Main business documents and embedded values. Clerk and Stripe are external services; their identities are represented by fields rather than local service-owned entities. Image values point to Sanity assets.
