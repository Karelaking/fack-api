/**
 * Fack AI API Architect — Agent Window Events
 *
 * The header action and the canvas composer live in different parts of the
 * tree, so they communicate over a small custom event rather than context.
 */

/** Opens (and focuses) the agent composer docked on the canvas. */
export const OPEN_AGENT_COMPOSER_EVENT = "open-agent-composer";
