// ---- Council Types ----

/** A council member backed by a Lumia item from a pack. */
export interface CouncilMember {
  id: string;
  packId: string;
  packName: string;
  itemId: string;
  itemName: string;
  /** Tool names this member is assigned. */
  tools: string[];
  /** Freeform role description (e.g. "Plot Enforcer"). */
  role: string;
  /** Probability (0–100) that this member participates each generation. */
  chance: number;
}

/** Sidecar LLM configuration — binds to an existing connection profile. */
export interface CouncilSidecarConfig {
  connectionProfileId: string;
  model: string;
  temperature: number;
  topP: number;
  maxTokens: number;
}

/** Settings governing council tool execution. */
export interface CouncilToolsSettings {
  enabled: boolean;
  /** Execution mode: "sidecar" uses a separate LLM, "inline" sends tools as function definitions to the main LLM. */
  mode: "sidecar" | "inline";
  /** Timeout per tool call in ms. */
  timeoutMs: number;
  /** Number of recent chat messages to include in sidecar context. */
  sidecarContextWindow: number;
  includeUserPersona: boolean;
  includeCharacterInfo: boolean;
  includeWorldInfo: boolean;
  /** Whether the user can trigger individual tools on demand. */
  allowUserControl: boolean;
  /** Word limit per tool response (0 = unlimited). */
  maxWordsPerTool: number;
  sidecar: CouncilSidecarConfig;
}

/** Top-level council settings object persisted per user. */
export interface CouncilSettings {
  councilMode: boolean;
  members: CouncilMember[];
  toolsSettings: CouncilToolsSettings;
}

// ---- Execution Results ----

/** Result of a single tool invocation for a single member. */
export interface CouncilToolResult {
  memberId: string;
  memberName: string;
  toolName: string;
  toolDisplayName: string;
  success: boolean;
  content: string;
  error?: string;
  durationMs: number;
}

/** Aggregate result of a full council execution cycle. */
export interface CouncilExecutionResult {
  results: CouncilToolResult[];
  deliberationBlock: string;
  totalDurationMs: number;
}

// ---- Tool Definition ----

export type CouncilToolCategory =
  | "story_direction"
  | "character_accuracy"
  | "writing_quality"
  | "context"
  | "content"
  | "extension";

/** Canonical definition of a council tool (built-in or DLC). */
export interface CouncilToolDefinition {
  name: string;
  displayName: string;
  description: string;
  category: CouncilToolCategory;
  /** The prompt sent to the sidecar LLM when invoking this tool. */
  prompt: string;
  /** JSON Schema describing the tool's expected output structure. */
  inputSchema: Record<string, unknown>;
  /** If set, the tool's result is stored under this variable name for macro access. */
  resultVariable?: string;
  /** Whether this tool's output appears in the deliberation block (default true). */
  storeInDeliberation?: boolean;
  /** Feature gate — tool is hidden when the named feature is disabled. */
  gatedBy?: string;
  /** Display name of the owning extension (set by frontend for extension-category tools). */
  extensionName?: string;
}

// ---- Defaults ----

export const COUNCIL_SIDECAR_DEFAULTS: CouncilSidecarConfig = {
  connectionProfileId: "",
  model: "",
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 1024,
};

export const COUNCIL_TOOLS_DEFAULTS: CouncilToolsSettings = {
  enabled: false,
  mode: "sidecar",
  timeoutMs: 30000,
  sidecarContextWindow: 25,
  includeUserPersona: true,
  includeCharacterInfo: true,
  includeWorldInfo: true,
  allowUserControl: false,
  maxWordsPerTool: 250,
  sidecar: { ...COUNCIL_SIDECAR_DEFAULTS },
};

export const COUNCIL_SETTINGS_DEFAULTS: CouncilSettings = {
  councilMode: false,
  members: [],
  toolsSettings: { ...COUNCIL_TOOLS_DEFAULTS },
};
