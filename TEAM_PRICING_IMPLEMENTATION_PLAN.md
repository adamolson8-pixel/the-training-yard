# Team Pricing Messaging Implementation Plan

## Objective

Replace public fixed team discounts and standardized team package prices with a consistent, relationship-first offer that invites coaches and organizations to call or request a tailored quote.

## Approved message

- Headline: **Custom Team Pricing, Built Around Your Season**
- Primary CTA: **Call for Custom Team Pricing**
- Secondary CTA: **Request Custom Team Pricing**
- Supporting promise: Every team has a different roster, schedule, practice plan, and budget. The Training Yard will work directly with each team to create discounted pricing that makes sense for its season.

## Customer journey

1. A coach sees the custom-pricing promise anywhere team rentals are mentioned.
2. The coach can immediately call `515.441.0528` or open the team inquiry form.
3. The inquiry asks about team size, sport, preferred setup, frequency, dates, and timing rather than asking the coach to choose a fixed-price package.
4. The Training Yard follows up with availability and a custom proposal.
5. Once approved, the existing team account, waiver, package-hour, and online booking tools continue to support the team.

## Implementation scope

1. Rebuild `/teams` around two facility configurations and a custom-pricing conversation instead of public rate tables and instant standardized checkout.
2. Add prominent telephone and quote-request CTAs above the fold and beside each team configuration.
3. Update the inquiry form so it captures preferred facility setup and scheduling needs without quoting fixed prices.
4. Update homepage, membership, booking, portal, FAQ, article, SEO, structured-data, and `llms.txt` references.
5. Preserve individual and family membership pricing and discounts; they are outside this change.
6. Preserve existing team accounts, purchased hours, waivers, and booking redemption behavior.

## Verification

- Search source and generated output for retired team price and fixed-discount claims.
- Confirm both team CTAs have clear destinations and accessible labels.
- Run the Nuxt production build.
- Verify `/`, `/training`, `/teams`, and the booking experience in generated output.
- Deploy to Netlify and repeat production route/content checks.
