/**
 * Security headers applied to every response.
 * These harden the application against XSS, clickjacking, MIME sniffing,
 * and other common browser-based attacks.
 */

export function applySecurityHeaders(headers: Headers): void {
  // Prevent browsers from MIME-sniffing a response away from the declared content-type
  headers.set("X-Content-Type-Options", "nosniff");

  // Deny embedding in iframes to prevent clickjacking
  headers.set("X-Frame-Options", "DENY");

  // Legacy XSS filter for older browsers
  headers.set("X-XSS-Protection", "1; mode=block");

  // Control how much referrer information is sent
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Enforce HTTPS for 1 year and include sub-domains
  headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );

  // Permissions Policy — disable dangerous browser features
  headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
  );

  // Content Security Policy
  // - default-src: only our own origin
  // - script-src: allow self + Next.js inline evaluation
  // - style-src: allow self + inline styles (Next.js injects critical CSS)
  // - img-src: allow self, data URIs, and our CDNs
  // - font-src: only self
  // - connect-src: allow self + Supabase
  // - frame-ancestors: deny embedding us
  headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",      // Next.js requires eval
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://*.supabase.co https://lh3.googleusercontent.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.cloudinary.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ")
  );
}
