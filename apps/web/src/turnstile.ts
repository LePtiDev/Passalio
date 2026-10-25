const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

const ALWAYS_PASSING_TEST_SITE_KEY = "1x00000000000000000000AA";

const PASSALIO_SITE_KEY = "0x4AAAAAAFiIzDUiQbmqacq6";

export const turnstileSiteKey = (isDevelopment: boolean): string =>
  isDevelopment ? ALWAYS_PASSING_TEST_SITE_KEY : PASSALIO_SITE_KEY;

type TurnstileRenderOptions = {
  readonly sitekey: string;
  readonly language: string;
  readonly appearance: "interaction-only";
  readonly size: "flexible";
  readonly "response-field": boolean;
  readonly callback: (token: string) => void;
  readonly "expired-callback": () => void;
  readonly "error-callback": () => void;
};

type TurnstileApi = {
  readonly render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
  readonly reset: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptLoading: Promise<TurnstileApi> | null = null;

const injectScript = () =>
  new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.addEventListener("load", () =>
      window.turnstile === undefined
        ? reject(new Error("turnstile_unavailable"))
        : resolve(window.turnstile),
    );
    script.addEventListener("error", () => reject(new Error("turnstile_unavailable")));
    document.head.append(script);
  });

const loadTurnstile = (): Promise<TurnstileApi> => {
  if (window.turnstile !== undefined) {
    return Promise.resolve(window.turnstile);
  }
  scriptLoading ??= injectScript().catch((error: unknown) => {
    scriptLoading = null;
    throw error;
  });
  return scriptLoading;
};

export type AntiRobotCheck = {
  readonly start: () => void;
  readonly token: () => Promise<string | null>;
  readonly renew: () => void;
};

export const createAntiRobotCheck = (container: HTMLElement, siteKey: string): AntiRobotCheck => {
  let widgetId: string | null = null;
  let current: string | null = null;
  let waiting: ((token: string | null) => void)[] = [];
  let starting: Promise<void> | null = null;

  const settle = (token: string | null) => {
    current = token;
    waiting.forEach((resolve) => resolve(token));
    waiting = [];
  };

  const render = async () => {
    try {
      const turnstile = await loadTurnstile();
      widgetId = turnstile.render(container, {
        sitekey: siteKey,
        language: "fr",
        appearance: "interaction-only",
        size: "flexible",
        "response-field": false,
        callback: (token) => settle(token),
        "expired-callback": () => {
          current = null;
        },
        "error-callback": () => settle(null),
      });
    } catch {
      starting = null;
      settle(null);
    }
  };

  const start = () => {
    starting ??= render();
  };

  return {
    start,
    token: () => {
      if (current !== null) {
        return Promise.resolve(current);
      }
      start();
      return new Promise((resolve) => {
        waiting.push(resolve);
      });
    },
    renew: () => {
      current = null;
      if (widgetId !== null) {
        window.turnstile?.reset(widgetId);
      }
    },
  };
};
