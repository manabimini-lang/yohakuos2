// ===================================================
// YOHAKU Auth Core — Public API
// ===================================================
//
// Import from this file for all auth needs.
// Do NOT import directly from subdirectories.
// ===================================================

// Types
export type {
  AuthProvider,
  Profile,
  AuthSession,
  AuthState,
  AuthResult,
  SignUpPayload,
  SignInPayload,
  AuthConfig,
} from "./types";

// Config
export { authConfig } from "./config";

// Server
export {
  getCurrentSession,
  requireAuth,
  requireSession,
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signInWithGithub,
  sendMagicLink,
  signOut,
  updateProfile,
  AuthRequiredError,
} from "./server";

// Client
export {
  clientSignInWithEmail,
  clientSignUpWithEmail,
  clientSignInWithGoogle,
  clientSignInWithGithub,
  clientSendMagicLink,
  clientSignOut,
} from "./client";

// Guards
export {
  isProtectedRoute,
  isPublicRoute,
  isAuthenticated,
  getLoginRedirect,
} from "./guards";

// Hooks
export { useAuth } from "./hooks/useAuth";

// Middleware
export { validateSession, isProtectedPath, isAuthPath } from "./middleware";