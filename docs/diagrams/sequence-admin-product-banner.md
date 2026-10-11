# Sequence B — admin product and banner management

The admin content API is shared by inventory/product and banner screens. Product and banner create/edit/publish flows share the same authorization and draft workflow.

```mermaid
sequenceDiagram
  actor Admin
  participant UI as Admin UI
  participant Clerk
  participant API as /api/admin/content
  participant Sanity as Sanity admin client
  participant Store as Storefront pages
  Admin->>UI: Sign in and edit product or banner
  UI->>API: GET admin content request
  API->>Clerk: requireAdmin() role check
  alt Not admin
    API-->>UI: 403 Forbidden
  else Admin
    API->>Sanity: Read raw document/draft
    Sanity-->>UI: Content and draft state
    opt Upload image
      UI->>API: PUT multipart image
      API->>Clerk: requireAdmin()
      API->>API: Check image MIME and 4 MB maximum
      API->>Sanity: Upload image asset
      Sanity-->>API: Asset ID
      API-->>UI: Asset ID
    end
    UI->>API: POST create or set action
    API->>Clerk: requireAdmin()
    API->>API: Zod request and field allowlist validation
    API->>Sanity: Create draft or patch drafts.<id>
    Sanity-->>API: Mutation result
    API-->>UI: Success or sanitized error
    opt Publish draft
      UI->>API: POST publish action
      API->>Sanity: Transaction replace published document + delete draft
      Sanity-->>API: Commit result
      API->>Store: Revalidate relevant paths
      API-->>UI: Published
    end
    opt Discard draft
      UI->>API: POST discard action
      API->>Sanity: Delete drafts.<id>
      API-->>UI: Discarded
    end
  end
```

**Caption:** Shared product/banner document workflow. Image upload stores an asset first; the edit request then references the asset. A4 landscape recommended.
