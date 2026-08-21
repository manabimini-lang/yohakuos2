import assert from "node:assert/strict";
import test from "node:test";
import {
  createGoogleOAuthState,
  verifyGoogleOAuthState,
} from "../../app/ui/backend/yui/google_oauth_state.ts";

test("accepts the state issued for the OAuth request", () => {
  const state = createGoogleOAuthState();

  assert.equal(verifyGoogleOAuthState(state, state), true);
});

test("rejects missing, mismatched, and differently sized OAuth state", () => {
  const state = createGoogleOAuthState();

  assert.equal(verifyGoogleOAuthState(undefined, state), false);
  assert.equal(verifyGoogleOAuthState(state, null), false);
  assert.equal(verifyGoogleOAuthState(state, createGoogleOAuthState()), false);
  assert.equal(verifyGoogleOAuthState(state, `${state}x`), false);
});
