/**
 * Gated permissions that extensions must declare in spindle.json.
 *
 * Free tier (no declaration needed): events, storage, macros, dom
 *
 * Gated tier (must declare):
 * - "generation"       — fire generations on behalf of user
 * - "interceptor"      — pre-generation prompt modification
 * - "tools"            — register LLM tools
 * - "cors_proxy"       — use CORS proxy
 * - "context_handler"  — register global context middleware
 */
export type SpindlePermission =
  | "generation"
  | "interceptor"
  | "tools"
  | "cors_proxy"
  | "context_handler"
  | "ephemeral_storage"
  | "chat_mutation"
  | "event_tracking"
  | "ui_panels"
  | "app_manipulation"
  | "oauth";

export const ALL_PERMISSIONS: readonly SpindlePermission[] = [
  "generation",
  "interceptor",
  "tools",
  "cors_proxy",
  "context_handler",
  "ephemeral_storage",
  "chat_mutation",
  "event_tracking",
  "ui_panels",
  "app_manipulation",
  "oauth",
] as const;

export function isValidPermission(p: string): p is SpindlePermission {
  return (ALL_PERMISSIONS as readonly string[]).includes(p);
}
