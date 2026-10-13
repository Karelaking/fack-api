/**
 * Fack AI API Architect — Mock JWT Secret Resolution
 *
 * The mock runtime can simulate Bearer-token auth. Tokens are signed by the
 * public `/_auth/token` endpoint and verified per-route, so both sides must
 * resolve the exact same secret.
 *
 * In production a dedicated `JWT_SECRET` is required: falling back to the
 * project id would be insecure, because the project id is exposed in mock
 * response envelopes. In development the project-id fallback is kept so the
 * auth simulation works locally without extra configuration.
 */

/**
 * Resolves the HMAC secret for a project's simulated mock JWTs.
 *
 * @param projectId - the owning project id (development fallback only).
 * @throws {Error} when running in production without `JWT_SECRET`.
 */
export function getMockJwtSecret(projectId: string): Uint8Array {
  const configured = process.env.JWT_SECRET;

  if (configured && configured.length > 0) {
    return new TextEncoder().encode(configured);
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "JWT_SECRET must be configured to use mock authentication in production.",
    );
  }

  return new TextEncoder().encode(projectId);
}
