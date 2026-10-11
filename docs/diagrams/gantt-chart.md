# Estimated Development Phases

**Retrospective Estimate:** The dates below are plausible estimates based on the project scope and submission deadline. They are not verified historical records. Feature inclusion reflects repository evidence and does not certify when or whether production deployment occurred.

| Phase | Estimated duration / dates | Main activities |
|---|---|---|
| Phase 1 | 1 week · 8–14 Aug 2026 | Requirements, project scope, architecture, and data model planning |
| Phase 2 | 2 weeks · 15–28 Aug 2026 | Sanity schemas, catalog queries, seed scripts, and category setup |
| Phase 3 | 3 weeks · 22 Aug–11 Sep 2026 | Storefront, product catalog, search, filters, cart, and wishlist |
| Phase 4 | 3 weeks · 5–25 Sep 2026 | Clerk authentication, checkout validation, Stripe integration, webhook, and orders |
| Phase 5 | 4 weeks · 12 Sep–9 Oct 2026 | Admin dashboard, product and banner management, notifications, AI features, shipping serviceability, and iterative fixes |
| Phase 6 | 2 weeks · 27 Sep–10 Oct 2026 | Testing, bug fixes, configuration review, diagram preparation, documentation, and final submission |

## Gantt Chart

```mermaid
gantt
    title Kumar Collection Development (Retrospective Estimate)
    dateFormat YYYY-MM-DD
    axisFormat %d %b

    section Phase 1 - Planning
    Requirements and architecture :p1, 2026-08-08, 7d

    section Phase 2 - Sanity Catalog
    Schemas, queries, and scripts :p2, 2026-08-15, 14d

    section Phase 3 - Storefront
    Catalog, search, filters, cart, wishlist :p3, 2026-08-22, 21d

    section Phase 4 - Commerce
    Authentication and checkout :p4a, 2026-09-05, 14d
    Stripe, webhooks, and orders :p4b, 2026-09-12, 14d

    section Phase 5 - Admin and Integrations
    Admin products and banners :p5a, 2026-09-12, 21d
    AI and shipping integrations :p5b, 2026-09-19, 21d
    Refinement and bug fixes :p5c, 2026-09-26, 14d

    section Phase 6 - Finalization
    Testing and documentation :p6, 2026-09-27, 14d
    Submission deadline :milestone, 2026-10-10, 0d
```

**Project Management Approach:** The development schedule uses overlapping phases to fit the project into the available period. Initial planning is followed by catalog and database setup. Storefront development begins while catalog work is in progress. Authentication, checkout, and order processing are developed after the core shopping flow is established. Admin tools and external integrations are implemented alongside commerce work. Testing, bug fixing, diagram preparation, and report writing continue during the final two weeks.

All dates and durations are retrospective planning estimates, not verified historical records. Actual feature implementation and deployment status must be checked against repository evidence.