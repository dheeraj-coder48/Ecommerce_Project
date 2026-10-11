# Sanity document relationship / ER diagram

Sanity is a document database. This diagram shows schema documents, embedded objects, and references; the connectors do not imply SQL foreign keys.

```mermaid
erDiagram
  CATEGORY {
    string _id
    string title
    slug slug
    array departments
    image image_embedded
  }
  PRODUCT {
    string _id
    string name
    slug slug
    number price
    number stock
    string gender
    string fabric
    array colors
    array size
    string fit
    string pattern
    boolean featured
    reference category
    array images_embedded
  }
  CUSTOMER {
    string _id
    string email
    string name
    string clerkUserId
    string stripeCustomerId
  }
  ORDER {
    string _id
    string orderNumber
    number total
    string status
    string paymentStatus
    string fulfillmentStatus
    string stripePaymentId
    string clerkUserId
    string email
    string customerPhone
    array items_embedded
    object address_embedded
    datetime createdAt
    reference customer
  }
  WISHLIST {
    string _id
    string clerkUserId
    array product_references
    datetime updatedAt
  }
  BANNER {
    string _id
    string title
    string subtitle
    string ctaText
    boolean active
    number displayOrder
    string destinationType
    reference category_optional
    reference product_optional
    image image_embedded
  }
  ORDER_STATUS_NOTIFICATION {
    string _id
    reference order
    string fromStatus
    string toStatus
    string deliveryStatus
    number attemptCount
    datetime lastAttemptAt
    datetime sentAt
    string lastErrorCode
  }
  EMAIL_DELIVERY {
    string _id
    string purpose
    string orderId
    string status
    datetime claimedAt
    datetime sentAt
  }
  SANITY_IMAGE_ASSET {
    string _id
    string url
  }
  CATEGORY ||--o{ PRODUCT : category_reference
  CUSTOMER o|--o{ ORDER : optional_customer_reference
  ORDER ||--o{ ORDER_STATUS_NOTIFICATION : status_email_history
  PRODUCT }o--o{ WISHLIST : item_references
  PRODUCT }o--o{ ORDER : embedded_item_reference
  CATEGORY o|--o{ BANNER : optional_target
  PRODUCT o|--o{ BANNER : optional_target
  SANITY_IMAGE_ASSET ||--o{ PRODUCT : image_assets
  SANITY_IMAGE_ASSET o|--o{ CATEGORY : optional_image
  SANITY_IMAGE_ASSET ||--o{ BANNER : banner_image
```

**Caption:** Current Sanity schema graph. Image fields and order item/address values are embedded; image assets and referenced documents are separate Sanity documents. `emailDelivery` is created by the confirmation-email claim logic, although it is not registered as a Studio schema type. A4 landscape recommended.
