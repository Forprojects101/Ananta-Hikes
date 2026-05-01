// Helper functions for email domain validation
export const ALLOWED_DOMAINS = ["gmail.com", "yahoo.com"];

export function isValidEmailDomain(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return domain ? ALLOWED_DOMAINS.includes(domain) : false;
}

export function generateVerificationCode(): string {
  return Math.random().toString(10).substring(2, 8);
}

export function hashPassword(password: string): string {
  // In production, use bcryptjs
  return Buffer.from(password).toString("base64");
}

export function verifyPassword(
  password: string,
  hash: string
): boolean {
  return hashPassword(password) === hash;
}

export async function sendVerificationEmail(
  email: string,
  code: string
): Promise<void> {
  // Import email service dynamically to use Brevo SMTP
  const { sendVerificationEmail: sendBrevoEmail } = await import("./email");
  return sendBrevoEmail(email, code);
}

// In-memory store for demo (use database in production)
export const verificationCodes = new Map<
  string,
  {
    code: string;
    expiresAt: number;
    attempts: number;
    locked: boolean;
    lockedUntil: number;
  }
>();

export const users = new Map<
  string,
  {
    id: string;
    email: string;
    name: string;
    passwordHash: string;
    emailVerified: boolean;
    verifiedAt?: string;
    createdAt: string;
  }
>();

// Database verification code functions
export async function storeVerificationCodeDb(email: string, code: string, codeType: string = "email_verification") {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

    const { data, error } = await supabase
      .from("verification_codes")
      .insert({
        email,
        code,
        code_type: codeType,
        is_used: false,
        attempts: 0,
        is_locked: false,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) {
      console.error("Error storing verification code:", error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error("Failed to store verification code in database:", err);
    // Fallback to in-memory (for development)
    storeVerificationCode(email, code);
  }
}

export async function getVerificationCodeDb(email: string, code: string, codeType: string = "email_verification") {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from("verification_codes")
      .select("*")
      .eq("email", email)
      .eq("code", code)
      .eq("code_type", codeType)
      .eq("is_used", false)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // No matching record
      }
      console.error("Error fetching verification code:", error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error("Failed to fetch verification code from database:", err);
    return null;
  }
}

export async function markVerificationCodeUsed(id: string) {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase
      .from("verification_codes")
      .update({ is_used: true })
      .eq("id", id);

    if (error) {
      console.error("Error marking verification code as used:", error);
      throw error;
    }
  } catch (err) {
    console.error("Failed to mark verification code as used:", err);
  }
}

export async function incrementVerificationAttempts(id: string) {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // First, get current attempts
    const { data: codeData, error: fetchError } = await supabase
      .from("verification_codes")
      .select("attempts, max_attempts")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    const newAttempts = (codeData?.attempts || 0) + 1;
    const maxAttempts = codeData?.max_attempts || 5;
    const isLocked = newAttempts >= maxAttempts;

    const updates: any = { attempts: newAttempts };
    if (isLocked) {
      updates.is_locked = true;
      updates.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    }

    const { error } = await supabase
      .from("verification_codes")
      .update(updates)
      .eq("id", id);

    if (error) throw error;

    return { newAttempts, maxAttempts, isLocked };
  } catch (err) {
    console.error("Failed to increment verification attempts:", err);
    return null;
  }
}

// Verification code functions
export function storeVerificationCode(email: string, code: string): void {
  verificationCodes.set(email, {
    code,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    attempts: 0,
    locked: false,
    lockedUntil: 0,
  });
}

export function getVerificationCode(email: string) {
  return verificationCodes.get(email);
}

export function incrementAttempts(email: string): void {
  const codeData = verificationCodes.get(email);
  if (codeData) {
    codeData.attempts++;
    if (codeData.attempts >= 5) {
      codeData.locked = true;
      codeData.lockedUntil = Date.now() + 15 * 60 * 1000; // 15 minute lockout
    }
  }
}

export function clearVerificationCode(email: string): void {
  verificationCodes.delete(email);
}

export function canResendCode(email: string): boolean {
  const codeData = verificationCodes.get(email);
  if (!codeData) return true;
  // Allow resend if original code has expired or 1 minute has passed
  return Date.now() - (codeData.expiresAt - 5 * 60 * 1000) > 60 * 1000;
}
