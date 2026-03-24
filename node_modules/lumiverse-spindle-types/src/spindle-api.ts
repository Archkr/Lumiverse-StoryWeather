import type { SpindleManifest } from "./manifest";
import type {
  LlmMessageDTO,
  MacroDefinitionDTO,
  ToolRegistrationDTO,
  GenerationRequestDTO,
  RequestInitDTO,
  ConnectionProfileDTO,
  PermissionDeniedDetail,
} from "./api";

/** The global `spindle` object available in backend extension workers */
export interface SpindleAPI {
  /** Subscribe to a Lumiverse event */
  on(event: string, handler: (payload: unknown) => void): () => void;

  /** Register a macro */
  registerMacro(def: MacroDefinitionDTO): void;
  /** Unregister a macro */
  unregisterMacro(name: string): void;
  /**
   * Push the latest value for a registered macro.
   * During prompt assembly the host returns this cached value instantly
   * instead of doing a synchronous RPC roundtrip to the worker.
   * Call this whenever the underlying data changes (e.g. from a polling loop).
   */
  updateMacroValue(name: string, value: string): void;

  /** Register an interceptor for pre-generation prompt modification */
  registerInterceptor(
    handler: (
      messages: LlmMessageDTO[],
      context: unknown
    ) => Promise<LlmMessageDTO[]>,
    priority?: number
  ): void;

  /** Register an LLM tool */
  registerTool(tool: ToolRegistrationDTO): void;
  /** Unregister an LLM tool */
  unregisterTool(name: string): void;

  /** Generation helpers */
  generate: {
    raw(input: GenerationRequestDTO): Promise<unknown>;
    quiet(input: GenerationRequestDTO): Promise<unknown>;
    batch(input: GenerationRequestDTO): Promise<unknown>;
  };

  /** Scoped storage (per-extension virtual disk) */
  storage: {
    read(path: string): Promise<string>;
    write(path: string, data: string): Promise<void>;
    readBinary(path: string): Promise<Uint8Array>;
    writeBinary(path: string, data: Uint8Array): Promise<void>;
    delete(path: string): Promise<void>;
    list(prefix?: string): Promise<string[]>;
    exists(path: string): Promise<boolean>;
    mkdir(path: string): Promise<void>;
    move(from: string, to: string): Promise<void>;
    stat(path: string): Promise<{
      exists: boolean;
      isFile: boolean;
      isDirectory: boolean;
      sizeBytes: number;
      modifiedAt: string;
    }>;
    getJson<T>(path: string, options?: { fallback?: T }): Promise<T>;
    setJson(path: string, value: unknown, options?: { indent?: number }): Promise<void>;
  };

  /** Per-user scoped storage (isolated per user, even for operator-scoped extensions) */
  userStorage: {
    read(path: string, userId?: string): Promise<string>;
    write(path: string, data: string, userId?: string): Promise<void>;
    delete(path: string, userId?: string): Promise<void>;
    list(prefix?: string, userId?: string): Promise<string[]>;
    exists(path: string, userId?: string): Promise<boolean>;
    mkdir(path: string, userId?: string): Promise<void>;
    getJson<T>(path: string, options?: { fallback?: T; userId?: string }): Promise<T>;
    setJson(path: string, value: unknown, options?: { indent?: number; userId?: string }): Promise<void>;
  };

  /** Encrypted at-rest secret storage (per-user, AES-256-GCM) */
  enclave: {
    put(key: string, value: string, userId?: string): Promise<void>;
    get(key: string, userId?: string): Promise<string | null>;
    delete(key: string, userId?: string): Promise<boolean>;
    has(key: string, userId?: string): Promise<boolean>;
    list(userId?: string): Promise<string[]>;
  };

  /** Temporary storage (permission: ephemeral_storage) */
  ephemeral: {
    read(path: string): Promise<string>;
    write(
      path: string,
      data: string,
      options?: { ttlMs?: number; reservationId?: string }
    ): Promise<void>;
    readBinary(path: string): Promise<Uint8Array>;
    writeBinary(
      path: string,
      data: Uint8Array,
      options?: { ttlMs?: number; reservationId?: string }
    ): Promise<void>;
    delete(path: string): Promise<void>;
    list(prefix?: string): Promise<string[]>;
    stat(path: string): Promise<{
      sizeBytes: number;
      createdAt: string;
      expiresAt?: string;
    }>;
    clearExpired(): Promise<number>;
    getPoolStatus(): Promise<{
      globalMaxBytes: number;
      globalUsedBytes: number;
      globalReservedBytes: number;
      globalAvailableBytes: number;
      extensionMaxBytes: number;
      extensionUsedBytes: number;
      extensionReservedBytes: number;
      extensionAvailableBytes: number;
      fileCount: number;
      fileCountMax: number;
    }>;
    requestBlock(
      sizeBytes: number,
      options?: { ttlMs?: number; reason?: string }
    ): Promise<{
      reservationId: string;
      sizeBytes: number;
      expiresAt: string;
    }>;
    releaseBlock(reservationId: string): Promise<void>;
  };

  /** Chat mutation helpers */
  chat: {
    getMessages(chatId: string): Promise<Array<{
      id: string;
      role: "system" | "user" | "assistant";
      content: string;
      metadata?: Record<string, unknown>;
    }>>;
    appendMessage(
      chatId: string,
      message: {
        role: "system" | "user" | "assistant";
        content: string;
        metadata?: Record<string, unknown>;
      }
    ): Promise<{ id: string }>;
    updateMessage(
      chatId: string,
      messageId: string,
      patch: {
        content?: string;
        metadata?: Record<string, unknown>;
      }
    ): Promise<void>;
    deleteMessage(chatId: string, messageId: string): Promise<void>;
  };

  /** Extension-level telemetry */
  events: {
    track(
      eventName: string,
      payload?: Record<string, unknown>,
      options?: {
        level?: "debug" | "info" | "warn" | "error";
        chatId?: string;
        retentionDays?: number;
      }
    ): Promise<void>;
    query(filter?: {
      eventName?: string;
      chatId?: string;
      since?: string;
      until?: string;
      level?: "debug" | "info" | "warn" | "error";
      limit?: number;
    }): Promise<
      Array<{
        id: string;
        ts: string;
        eventName: string;
        level: "debug" | "info" | "warn" | "error";
        chatId?: string;
        payload?: Record<string, unknown>;
      }>
    >;
    replay(filter?: {
      eventName?: string;
      chatId?: string;
      since?: string;
      until?: string;
      level?: "debug" | "info" | "warn" | "error";
      limit?: number;
    }): Promise<
      Array<{
        id: string;
        ts: string;
        eventName: string;
        level: "debug" | "info" | "warn" | "error";
        chatId?: string;
        payload?: Record<string, unknown>;
      }>
    >;
    getLatestState(keys: string[]): Promise<Record<string, unknown>>;
  };

  /**
   * Connection profile access (permission: "generation").
   * Returns safe representations — API keys are never exposed.
   */
  connections: {
    /**
     * List connection profiles visible to the current user context.
     * For user-scoped extensions, userId is inferred from the extension owner.
     * For operator-scoped extensions, pass userId to scope to a specific user.
     */
    list(userId?: string): Promise<ConnectionProfileDTO[]>;
    /**
     * Get a single connection profile by ID.
     * Returns null if the connection doesn't exist or isn't accessible.
     */
    get(connectionId: string, userId?: string): Promise<ConnectionProfileDTO | null>;
  };

  permissions: {
    getGranted(): Promise<string[]>;
    /**
     * Register a handler invoked whenever a gated operation is blocked
     * because the required permission has not been granted.
     * Returns an unsubscribe function.
     */
    onDenied(handler: (detail: PermissionDeniedDetail) => void): () => void;
  };

  /** Make a CORS-proxied HTTP request */
  cors(url: string, options?: RequestInitDTO): Promise<unknown>;

  /** Register a context handler for enriching generation context */
  registerContextHandler(
    handler: (context: unknown) => Promise<unknown>,
    priority?: number
  ): void;

  /** Send a message to the frontend module */
  sendToFrontend(payload: unknown): void;
  /** Receive messages from the frontend module (userId is the sender) */
  onFrontendMessage(handler: (payload: unknown, userId: string) => void): () => void;

  /** Logging */
  log: {
    info(msg: string): void;
    warn(msg: string): void;
    error(msg: string): void;
  };

  /** OAuth callback handling (permission: "oauth") */
  oauth: {
    /** Register a handler invoked when this extension's OAuth callback URL is hit */
    onCallback(handler: (params: Record<string, string>) => Promise<{ html?: string } | void>): () => void;
    /** Get the relative callback URL path for this extension */
    getCallbackUrl(): string;
    /** Create a platform-managed OAuth state nonce for CSRF protection */
    createState(): Promise<string>;
  };

  /** This extension's manifest */
  manifest: SpindleManifest;
}
