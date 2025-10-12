# Content Security Policy - Inline Script/Style Requirements

## Current Status

The application currently uses `'unsafe-inline'` in the CSP for both `script-src` and `style-src` directives. This document explains why this is necessary and outlines paths forward.

## Why `'unsafe-inline'` is Required

### 1. Chart Component (src/components/ui/chart.tsx)

**Location**: Lines 72-90

**Reason**: The Recharts chart library dynamically generates CSS custom properties using `dangerouslySetInnerHTML` to inject `<style>` tags:

```typescript
<style
  dangerouslySetInnerHTML={{
    __html: Object.entries(THEMES)
      .map(([theme, prefix]) => `
${prefix} [data-chart=${id}] {
  --color-${key}: ${color};
}
`)
      .join('\n'),
  }}
/>
```

**Risk Level**: **Low** - The HTML being injected is controlled and sanitized (only CSS custom properties with validated color values).

**Mitigation Options**:

- Use CSS-in-JS with `styled-jsx` and nonces
- Pre-generate theme styles at build time
- Use CSS Modules instead of inline styles

### 2. Version History Panel (app/editor/[manuscriptId]/components/VersionHistoryPanel.tsx)

**Location**: Line 259

**Reason**: Displays rich text HTML content from saved manuscript versions:

```typescript
<div
  className="prose prose-sm max-w-none p-4"
  dangerouslySetInnerHTML={{ __html: previewVersion?.content || '' }}
/>
```

**Risk Level**: **MEDIUM** - User-generated content is being rendered as HTML

**Mitigation**: Currently using DOMPurify sanitization (see src/lib/sanitize.ts). Content should be sanitized BEFORE storage.

**Mitigation Options**:

- Ensure all user content is sanitized with DOMPurify before database insertion
- Consider using a markdown renderer instead of raw HTML
- Implement a content security scanning layer

### 3. Third-Party Scripts

**Services Using Inline Scripts**:

- Stripe.js (`https://js.stripe.com`)
- Vercel Analytics (`https://cdn.vercel-insights.com`)
- Sentry error tracking

**Risk Level**: **Low** - Trusted third-party services with HTTPS origins

## Current CSP Configuration

```javascript
script-src 'self' 'unsafe-inline' https://js.stripe.com https://cdn.vercel-insights.com
style-src 'self' 'unsafe-inline'
```

## Recommendations

### Immediate Actions (P1)

1. ✅ **COMPLETED**: Removed `'unsafe-eval'` from script-src
2. ✅ **COMPLETED**: Added Sentry ingest host to connect-src
3. ⚠️ **KEEP**: `'unsafe-inline'` remains necessary for current architecture

### Future Improvements (P2)

1. **Implement CSP Nonces**:
   - Generate a nonce per request in middleware
   - Pass nonce to inline scripts via Next.js Script component
   - Add nonce to CSP header dynamically

2. **Refactor Chart Component**:
   - Move to CSS Modules or Tailwind CSS variables
   - Pre-generate theme styles at build time
   - Eliminate `dangerouslySetInnerHTML` usage

3. **Strengthen Content Sanitization**:
   - Sanitize ALL user input before database storage
   - Add server-side HTML sanitization layer
   - Consider using markdown with a safe renderer

4. **Monitor and Report**:
   - Enable CSP reporting with `report-uri` directive
   - Monitor violation reports in Sentry
   - Track inline script usage patterns

## Testing CSP Changes

When modifying CSP, test these critical flows:

1. ✅ User registration and OAuth login
2. ✅ Manuscript creation and editing
3. ✅ Chart rendering on analytics pages
4. ✅ Stripe payment checkout
5. ✅ Version history preview
6. ✅ Script editor functionality

## References

- [MDN CSP Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)
- [OWASP CSP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)

## Last Updated

2025-10-12 - Documented inline requirements after security hardening audit
