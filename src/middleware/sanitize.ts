/**
 * Input sanitization for URL query parameters and path segments.
 * Strips HTML tags and common XSS vectors from the request URL before
 * it reaches any route handler.  This is a first-pass defence; always
 * validate and sanitise on the server side as well.
 */

const DANGEROUS_PATTERNS = [
  /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
  /<[^>]+>/g,               // Any HTML tag
  /javascript:/gi,
  /on\w+\s*=/gi,            // Event handlers (onclick=, onload=, …)
  /data:\s*text\/html/gi,   // Data-URI XSS
  /vbscript:/gi,
];

function sanitiseString(value: string): string {
  let out = value;
  for (const pattern of DANGEROUS_PATTERNS) {
    out = out.replace(pattern, "");
  }
  return out;
}

/**
 * Returns a sanitised version of the URL's search params.
 * If any value was modified, the function returns the cleaned URL string;
 * otherwise it returns null (no sanitisation needed).
 */
export function sanitiseSearchParams(url: URL): string | null {
  let dirty = false;
  const params = new URLSearchParams();

  Array.from(url.searchParams.entries()).forEach(([key, value]) => {
    const cleanKey   = sanitiseString(key);
    const cleanValue = sanitiseString(value);
    if (cleanKey !== key || cleanValue !== value) dirty = true;
    params.set(cleanKey, cleanValue);
  });

  if (!dirty) return null;

  const cleaned = new URL(url.toString());
  cleaned.search = params.toString();
  return cleaned.toString();
}
