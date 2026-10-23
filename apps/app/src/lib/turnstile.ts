const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

const ALWAYS_PASSING_TEST_SITE_KEY = "1x00000000000000000000AA";

const PASSALIO_SITE_KEY = "0x4AAAAAAFiIzDUiQbmqacq6";

export const TURNSTILE_SITE_KEY = import.meta.env.DEV
  ? ALWAYS_PASSING_TEST_SITE_KEY
  : PASSALIO_SITE_KEY;

export const CAPTCHA_HEADER = "x-captcha-response";

type TurnstileRenderOptions = {
  readonly sitekey: string;
  readonly language: string;
  readonly appearance: "always" | "execute" | "interaction-only";
  readonly size: "normal" | "flexible" | "compact";
  readonly "response-field": boolean;
  readonly callback: (token: string) => void;
  readonly "expired-callback": () => void;
  readonly "error-callback": () => void;
  readonly "before-interactive-callback": () => void;
  readonly "after-interactive-callback": () => void;
};

export type TurnstileApi = {
  readonly render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
  readonly reset: (widgetId: string) => void;
  readonly remove: (widgetId: string) => void;
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
    script.addEventListener("load", () => {
      if (window.turnstile === undefined) {
        reject(new Error("turnstile_unavailable"));
        return;
      }
      resolve(window.turnstile);
    });
    script.addEventListener("error", () => reject(new Error("turnstile_unavailable")));
    document.head.append(script);
  });

export const loadTurnstile = (): Promise<TurnstileApi> => {
  if (window.turnstile !== undefined) {
    return Promise.resolve(window.turnstile);
  }
  scriptLoading ??= injectScript().catch((error: unknown) => {
    scriptLoading = null;
    throw error;
  });
  return scriptLoading;
};
