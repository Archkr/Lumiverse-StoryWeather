import type { SpindleManifest } from "./manifest";

// ─── DTO types for messages ──────────────────────────────────────────────

export interface LlmMessageDTO {
  role: "system" | "user" | "assistant";
  content: string;
  name?: string;
}

export interface MacroDefinitionDTO {
  name: string;
  category: string;
  description: string;
  returnType?: "string" | "integer" | "number" | "boolean";
  args?: { name: string; description?: string; required?: boolean }[];
  handler: string; // serialized function body (executed in worker context)
}

export interface ToolRegistrationDTO {
  name: string;
  display_name: string;
  description: string;
  parameters: Record<string, unknown>; // JSON Schema
  council_eligible?: boolean;
}

export interface GenerationRequestDTO {
  type: "raw" | "quiet" | "batch";
  messages?: LlmMessageDTO[];
  parameters?: Record<string, unknown>;
  connection_id?: string;
  /**
   * For operator-scoped extensions: the user ID whose connection profiles
   * and generation context should be used. For user-scoped extensions this
   * is inferred from the extension owner and can be omitted.
   */
  userId?: string;
}

export interface RequestInitDTO {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

/**
 * Safe representation of a user's connection profile exposed to extensions.
 * Never contains the actual API key — only `has_api_key` boolean.
 */
export interface ConnectionProfileDTO {
  id: string;
  name: string;
  provider: string;
  api_url: string;
  model: string;
  preset_id: string | null;
  is_default: boolean;
  has_api_key: boolean;
  metadata: Record<string, unknown>;
  created_at: number;
  updated_at: number;
}

/**
 * Structured error code included in permission-denied error messages.
 * Extensions can check `error.startsWith("PERMISSION_DENIED:")` to
 * programmatically distinguish permission errors from runtime failures.
 */
export const PERMISSION_DENIED_PREFIX = "PERMISSION_DENIED:" as const;

/**
 * Detail object delivered via the `permission_denied` host→worker message
 * when a fire-and-forget registration is blocked by a missing grant.
 */
export interface PermissionDeniedDetail {
  /** The permission that was required but not granted */
  permission: string;
  /** Human-readable description of the operation that was blocked */
  operation: string;
}

// ─── Worker → Host messages ──────────────────────────────────────────────

export type WorkerToHost =
  | { type: "subscribe_event"; event: string }
  | { type: "unsubscribe_event"; event: string }
  | { type: "register_macro"; definition: MacroDefinitionDTO }
  | { type: "unregister_macro"; name: string }
  | { type: "update_macro_value"; name: string; value: string }
  | { type: "register_interceptor"; priority?: number }
  | { type: "intercept_result"; requestId: string; messages: LlmMessageDTO[] }
  | { type: "register_tool"; tool: ToolRegistrationDTO }
  | { type: "unregister_tool"; name: string }
  | { type: "request_generation"; requestId: string; input: GenerationRequestDTO }
  | { type: "storage_read"; requestId: string; path: string }
  | { type: "storage_write"; requestId: string; path: string; data: string }
  | { type: "storage_read_binary"; requestId: string; path: string }
  | {
      type: "storage_write_binary";
      requestId: string;
      path: string;
      data: Uint8Array;
    }
  | { type: "storage_delete"; requestId: string; path: string }
  | { type: "storage_list"; requestId: string; prefix?: string }
  | { type: "storage_exists"; requestId: string; path: string }
  | { type: "storage_mkdir"; requestId: string; path: string }
  | { type: "storage_move"; requestId: string; from: string; to: string }
  | { type: "storage_stat"; requestId: string; path: string }
  | { type: "ephemeral_read"; requestId: string; path: string }
  | {
      type: "ephemeral_write";
      requestId: string;
      path: string;
      data: string;
      ttlMs?: number;
      reservationId?: string;
    }
  | { type: "ephemeral_read_binary"; requestId: string; path: string }
  | {
      type: "ephemeral_write_binary";
      requestId: string;
      path: string;
      data: Uint8Array;
      ttlMs?: number;
      reservationId?: string;
    }
  | { type: "ephemeral_delete"; requestId: string; path: string }
  | { type: "ephemeral_list"; requestId: string; prefix?: string }
  | { type: "ephemeral_stat"; requestId: string; path: string }
  | { type: "ephemeral_clear_expired"; requestId: string }
  | { type: "ephemeral_pool_status"; requestId: string }
  | {
      type: "ephemeral_request_block";
      requestId: string;
      sizeBytes: number;
      ttlMs?: number;
      reason?: string;
    }
  | {
      type: "ephemeral_release_block";
      requestId: string;
      reservationId: string;
    }
  | { type: "permissions_get_granted"; requestId: string }
  | { type: "connections_list"; requestId: string; userId?: string }
  | { type: "connections_get"; requestId: string; connectionId: string; userId?: string }
  | { type: "chat_get_messages"; requestId: string; chatId: string }
  | {
      type: "chat_append_message";
      requestId: string;
      chatId: string;
      message: {
        role: "system" | "user" | "assistant";
        content: string;
        metadata?: Record<string, unknown>;
      };
    }
  | {
      type: "chat_update_message";
      requestId: string;
      chatId: string;
      messageId: string;
      patch: {
        content?: string;
        metadata?: Record<string, unknown>;
      };
    }
  | {
      type: "chat_delete_message";
      requestId: string;
      chatId: string;
      messageId: string;
    }
  | {
      type: "events_track";
      requestId: string;
      eventName: string;
      payload?: Record<string, unknown>;
      options?: {
        level?: "debug" | "info" | "warn" | "error";
        chatId?: string;
        retentionDays?: number;
      };
    }
  | {
      type: "events_query";
      requestId: string;
      filter?: {
        eventName?: string;
        chatId?: string;
        since?: string;
        until?: string;
        level?: "debug" | "info" | "warn" | "error";
        limit?: number;
      };
    }
  | {
      type: "events_replay";
      requestId: string;
      filter?: {
        eventName?: string;
        chatId?: string;
        since?: string;
        until?: string;
        level?: "debug" | "info" | "warn" | "error";
        limit?: number;
      };
    }
  | {
      type: "events_get_latest_state";
      requestId: string;
      keys: string[];
    }
  | { type: "cors_request"; requestId: string; url: string; options: RequestInitDTO }
  | { type: "register_context_handler"; priority?: number }
  | {
      type: "context_handler_result";
      requestId: string;
      context: unknown;
    }
  | {
      type: "macro_result";
      requestId: string;
      result?: string;
      error?: string;
    }
  | { type: "frontend_message"; payload: unknown }
  | { type: "user_storage_read"; requestId: string; path: string; userId?: string }
  | { type: "user_storage_write"; requestId: string; path: string; data: string; userId?: string }
  | { type: "user_storage_delete"; requestId: string; path: string; userId?: string }
  | { type: "user_storage_list"; requestId: string; prefix?: string; userId?: string }
  | { type: "user_storage_exists"; requestId: string; path: string; userId?: string }
  | { type: "user_storage_mkdir"; requestId: string; path: string; userId?: string }
  | { type: "enclave_put"; requestId: string; key: string; value: string; userId?: string }
  | { type: "enclave_get"; requestId: string; key: string; userId?: string }
  | { type: "enclave_delete"; requestId: string; key: string; userId?: string }
  | { type: "enclave_has"; requestId: string; key: string; userId?: string }
  | { type: "enclave_list"; requestId: string; userId?: string }
  | {
      type: "oauth_callback_result";
      requestId: string;
      html?: string;
      error?: string;
    }
  | { type: "tool_invocation_result"; requestId: string; result?: string; error?: string }
  | { type: "create_oauth_state"; requestId: string }
  | { type: "log"; level: "info" | "warn" | "error"; message: string };

// ─── Host → Worker messages ──────────────────────────────────────────────

export type HostToWorker =
  | { type: "init"; manifest: SpindleManifest; storagePath: string }
  | { type: "event"; event: string; payload: unknown }
  | {
      type: "intercept_request";
      requestId: string;
      messages: LlmMessageDTO[];
      context: unknown;
    }
  | {
      type: "context_handler_request";
      requestId: string;
      context: unknown;
    }
  | {
      type: "response";
      requestId: string;
      result?: unknown;
      error?: string;
    }
  | {
      type: "permission_denied";
      permission: string;
      operation: string;
    }
  | {
      type: "tool_invocation";
      requestId: string;
      toolName: string;
      args: Record<string, unknown>;
    }
  | { type: "shutdown" }
  | { type: "frontend_message"; payload: unknown; userId: string }
  | {
      type: "oauth_callback";
      requestId: string;
      params: Record<string, string>;
    };
