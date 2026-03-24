/** DOM helper API provided to frontend extension modules */
export interface SpindleDOMHelper {
  /** Inject sanitized HTML into a target area */
  inject(
    target: string | Element,
    html: string,
    position?: InsertPosition
  ): Element;

  /** Create a scoped style element. Returns a removal function. */
  addStyle(css: string): () => void;

  /** Create an element safely with optional attributes */
  createElement<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    attrs?: Record<string, string>
  ): HTMLElementTagNameMap[K];

  /** Query within this extension's own injected elements only */
  query(selector: string): Element | null;

  /** Query all within this extension's own injected elements only */
  queryAll(selector: string): Element[];

  /** Remove all DOM injections by this extension */
  cleanup(): void;
}

export type SpindleMountPoint =
  | "sidebar"
  | "chat_toolbar"
  | "message_footer"
  | "settings_extensions";

// ── Drawer Tab ──

export interface SpindleDrawerTabOptions {
  id: string;
  title: string;
  iconUrl?: string;
  iconSvg?: string;
}

export interface SpindleDrawerTabHandle {
  root: HTMLElement;
  tabId: string;
  setTitle(title: string): void;
  setBadge(text: string | null): void;
  activate(): void;
  destroy(): void;
  onActivate(handler: () => void): () => void;
}

// ── Float Widget ──

export interface SpindleFloatWidgetOptions {
  width?: number;
  height?: number;
  initialPosition?: { x: number; y: number };
  snapToEdge?: boolean;
  tooltip?: string;
  /** Strip default container chrome (border, background, shadow, border-radius).
   *  The extension fully owns the visual presentation. */
  chromeless?: boolean;
}

export interface SpindleFloatWidgetHandle {
  root: HTMLElement;
  widgetId: string;
  moveTo(x: number, y: number): void;
  getPosition(): { x: number; y: number };
  setVisible(visible: boolean): void;
  isVisible(): boolean;
  destroy(): void;
  onDragEnd(handler: (pos: { x: number; y: number }) => void): () => void;
}

// ── Dock Panel ──

export type SpindleDockEdge = "left" | "right" | "top" | "bottom";

export interface SpindleDockPanelOptions {
  edge: SpindleDockEdge;
  title: string;
  size: number;
  minSize?: number;
  maxSize?: number;
  resizable?: boolean;
  iconUrl?: string;
  startCollapsed?: boolean;
}

export interface SpindleDockPanelHandle {
  root: HTMLElement;
  panelId: string;
  collapse(): void;
  expand(): void;
  isCollapsed(): boolean;
  setTitle(title: string): void;
  destroy(): void;
  onVisibilityChange(handler: (visible: boolean) => void): () => void;
}

// ── App Mount ──

export interface SpindleAppMountOptions {
  className?: string;
  position?: "start" | "end";
}

export interface SpindleAppMountHandle {
  root: HTMLElement;
  mountId: string;
  setVisible(visible: boolean): void;
  destroy(): void;
}

// ── Input Bar Action ──

export interface SpindleInputBarActionOptions {
  id: string;
  label: string;
  iconSvg?: string;
  iconUrl?: string;
  enabled?: boolean;
}

export interface SpindleInputBarActionHandle {
  actionId: string;
  setLabel(label: string): void;
  setEnabled(enabled: boolean): void;
  onClick(handler: () => void): () => void;
  destroy(): void;
}

export interface SpindleUploadFile {
  name: string;
  mimeType: string;
  sizeBytes: number;
  bytes: Uint8Array;
}

export interface SpindleMessageTagIntercept {
  extensionId: string;
  tagName: string;
  attrs: Record<string, string>;
  content: string;
  fullMatch: string;
  messageId?: string;
  chatId?: string;
  isUser?: boolean;
  isStreaming?: boolean;
}

export interface SpindleMessageTagInterceptorOptions {
  tagName: string;
  attrs?: Record<string, string>;
  removeFromMessage?: boolean;
}

/** Context object provided to frontend extension modules */
export interface SpindleFrontendContext {
  dom: SpindleDOMHelper;
  events: {
    on(event: string, handler: (payload: unknown) => void): () => void;
    emit(event: string, payload: unknown): void;
  };
  ui: {
    mount(point: SpindleMountPoint): Element;
    registerDrawerTab(options: SpindleDrawerTabOptions): SpindleDrawerTabHandle;
    createFloatWidget(options?: SpindleFloatWidgetOptions): SpindleFloatWidgetHandle;
    requestDockPanel(options: SpindleDockPanelOptions): SpindleDockPanelHandle;
    mountApp(options?: SpindleAppMountOptions): SpindleAppMountHandle;
    registerInputBarAction(options: SpindleInputBarActionOptions): SpindleInputBarActionHandle;
  };
  uploads: {
    pickFile(options?: {
      accept?: string[];
      multiple?: boolean;
      maxSizeBytes?: number;
    }): Promise<SpindleUploadFile[]>;
  };
  permissions: {
    getGranted(): Promise<string[]>;
    /** Request that the given permissions be granted. Returns the updated granted list.
     *  Privileged permissions (e.g. cors_proxy) require admin/owner approval.
     *  The extension may be restarted after permissions are applied. */
    request(permissions: string[]): Promise<string[]>;
  };
  sendToBackend(payload: unknown): void;
  onBackendMessage(handler: (payload: unknown) => void): () => void;
  messages: {
    registerTagInterceptor(
      options: SpindleMessageTagInterceptorOptions,
      handler: (payload: SpindleMessageTagIntercept) => void
    ): () => void;
  };
  manifest: import("./manifest").SpindleManifest;
}

/** What a frontend extension module must export */
export interface SpindleFrontendModule {
  setup(ctx: SpindleFrontendContext): void | (() => void);
  teardown?(): void;
}
