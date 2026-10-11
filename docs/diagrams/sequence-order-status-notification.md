# Sequence C — order status and notification

The API persists fulfillment state, creates a notification record, then attempts email delivery. A manual retry is available for failed notifications; uncertain delivery is marked unknown and requires review.

```mermaid
sequenceDiagram
  actor Admin
  participant UI as Admin order UI
  participant API as Fulfillment status route
  participant Clerk
  participant Sanity
  participant Action as Notification delivery action
  participant SMTP
  participant Customer
  Admin->>UI: Select new fulfillment status
  UI->>API: PATCH fulfillment status
  API->>Clerk: requireAdmin()
  alt Unauthorized
    API-->>UI: 403 Forbidden
  else Authorized
    API->>API: Validate status and request
    API->>Sanity: Read order and current status
    API->>Sanity: Patch fulfillment status and timestamp
    API->>Sanity: Create orderStatusNotification record
    API->>Action: deliverOrderStatusNotification(id)
    Action->>Sanity: Claim record using revision check
    alt Missing recipient or configuration
      Action->>Sanity: Mark failed with error code
    else Claimed
      Action->>SMTP: Send fulfillment email
      alt SMTP accepts
        SMTP-->>Customer: Status message
        Action->>Sanity: Mark sent and timestamp
      else SMTP error / uncertain result
        Action->>Sanity: Mark unknown; do not auto-resend
      end
    end
    API-->>UI: Updated status and notification outcome
    opt Admin retries eligible failed notification
      UI->>API: POST retry notification ID
      API->>Clerk: requireAdmin()
      API->>Sanity: Validate order and failed state
      API->>Action: Attempt delivery again
    end
  end
```

**Caption:** Status mutation and notification tracking. Attempt counts and delivery states are stored in Sanity. SMTP errors can be ambiguous, so the implementation records `unknown` instead of automatically sending again. A4 landscape recommended.
