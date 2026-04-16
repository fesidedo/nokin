# Nikon Lens Explorer - Research Resources

## Source page reviewed
- Photosynthesis Nikon lenses index:
  - http://www.photosynthesis.co.nz/nikon/lenses.html

## Official documentation and references

### eBay
- API call limits:
  - https://developer.ebay.com/develop/get-started/api-call-limits
- Browse API overview:
  - https://developer.ebay.com/api-docs/buy/browse/overview.html
- Buy API production requirements:
  - https://developer.ebay.com/api-docs/buy/static/buy-requirements.html
- Marketplace Insights methods landing (for access visibility/reference):
  - https://developer.ebay.com/api-docs/marketplace-insights-private/buy/marketplace-insights/resources/methods

### Cloudflare
- Workers pricing:
  - https://developers.cloudflare.com/workers/platform/pricing/
- Pages Functions pricing:
  - https://developers.cloudflare.com/pages/functions/pricing/
- Workers limits:
  - https://developers.cloudflare.com/workers/platform/limits/

## Key findings captured

### eBay API
- API usage for this project is quota/rate-limit constrained rather than standard pay-per-call billing.
- Default Browse API quota is documented at 5,000 calls/day for many app profiles.
- Limits can be increased through eBay's application growth process.
- Production access for Buy APIs may require additional approvals/contracts depending on business model.

### Cloudflare hosting model
- Static assets can stay on Cloudflare Pages.
- Dynamic endpoints can be implemented with Pages Functions (billed under Workers model).
- Free/paid limits for function invocations follow Workers pricing and quota rules.
- This model supports a mostly static site with secure server-side API calls.

## Architecture implication
Recommended deployment model:
1. Static frontend on Cloudflare Pages.
2. Serverless API endpoint for eBay lookup.
3. Server-side secret handling for eBay credentials.
4. Response caching to reduce quota usage and improve performance.
