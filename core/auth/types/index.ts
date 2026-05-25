// ===================================================
// YOHAKU Auth Core — Type Definitions
// ===================================================

/**
 * Auth provider identifiers.
 * Extensible for future providers (Apple, Twitter, etc.)
 */
export type AuthProvider = "email" | "google" | "github" | "magic_link";

/**
 * User profile stored in the profiles table.
 * This is the application-level user identity.
 * Separated from auth.users for security and flexibility.
 */
export type Profile = {
  id: string;
  authUserId: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Auth session with hydrated profile.
 * This is what the app uses after authentication.
 */
export type AuthSession = {
  /** Supabase auth user ID */
  id: string;
  /** User's email (from auth.users) */
  email: string;
  /** Application profile */
  profile: Profile | null;
};

/**
 * Auth state for client-side hooks.
 */
export type AuthState = {
  isLoading: boolean;
  isAuthenticated: boolean;
  session: AuthSession | null;
  error: string | null;
};

/**
 * Auth action results.
 */
export type AuthResult = {
  success: boolean;
  error?: string;
  redirectTo?: string;
};

/**
 * Sign-up payload.
 */
export type SignUpPayload = {
  email: string;
  password: string;
  displayName?: string;
};

/**
 * Sign-in payload.
 */
export type SignInPayload = {
  email: string;
  password: string;
};

/**
 * Auth configuration.
 */
export type AuthConfig = {
  redirectAfterLogin: string;
  redirectAfterLogout: string;
  redirectAfterSignUp: string;
};