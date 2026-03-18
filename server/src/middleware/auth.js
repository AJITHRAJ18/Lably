// ============================================================
// Lably — Auth Middleware
// Verifies Supabase JWT from the Authorization header.
// Attaches req.user = { id, email } on success.
// ============================================================

import { supabase } from "../services/supabase.js";

/**
 * requireAuth — verifies the Bearer JWT from Supabase Auth.
 * Returns 401 if token is missing or invalid.
 */
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Please sign in to continue.",
    });
  }

  const token = authHeader.slice(7); // strip "Bearer "

  try {
    // Verify the JWT against Supabase — this is the secure approach.
    // The token is issued by Supabase and contains the user's ID and email.
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid or expired session. Please sign in again.",
      });
    }

    // Attach the verified user to the request context
    req.user = { id: user.id, email: user.email };
    next();
  } catch {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Authentication failed.",
    });
  }
}
