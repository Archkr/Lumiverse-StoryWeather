export type {
  SpindleManifest,
  SpindlePermission,
} from "./manifest";
export {
  IDENTIFIER_PATTERN,
  validateIdentifier,
} from "./manifest";

export type { SpindlePermission as SpindlePermissionType } from "./permissions";
export { ALL_PERMISSIONS, isValidPermission } from "./permissions";

export { SpindleEvent, CoreEventType } from "./events";

export type {
  LlmMessageDTO,
  MacroDefinitionDTO,
  ToolRegistrationDTO,
  GenerationRequestDTO,
  RequestInitDTO,
  ConnectionProfileDTO,
  PermissionDeniedDetail,
  WorkerToHost,
  HostToWorker,
} from "./api";
export { PERMISSION_DENIED_PREFIX } from "./api";

export type { ToolRegistration, JSONSchema } from "./tools";

export type {
  SpindleDOMHelper,
  SpindleMountPoint,
  SpindleUploadFile,
  SpindleMessageTagIntercept,
  SpindleMessageTagInterceptorOptions,
  SpindleFrontendContext,
  SpindleFrontendModule,
  SpindleDrawerTabOptions,
  SpindleDrawerTabHandle,
  SpindleFloatWidgetOptions,
  SpindleFloatWidgetHandle,
  SpindleDockEdge,
  SpindleDockPanelOptions,
  SpindleDockPanelHandle,
  SpindleAppMountOptions,
  SpindleAppMountHandle,
  SpindleInputBarActionOptions,
  SpindleInputBarActionHandle,
} from "./dom";

export type { ExtensionInfo } from "./extension-info";

export type { SpindleAPI } from "./spindle-api";

export type {
  CouncilMember,
  CouncilSidecarConfig,
  CouncilToolsSettings,
  CouncilSettings,
  CouncilToolResult,
  CouncilExecutionResult,
  CouncilToolCategory,
  CouncilToolDefinition,
} from "./council";
export {
  COUNCIL_SIDECAR_DEFAULTS,
  COUNCIL_TOOLS_DEFAULTS,
  COUNCIL_SETTINGS_DEFAULTS,
} from "./council";
