import { useCallback, useEffect, useRef, useState } from "react";
import {
  CAPTCHA_HEADER,
  loadTurnstile,
  TURNSTILE_SITE_KEY,
  type TurnstileApi,
} from "@/lib/turnstile";

const TOKEN_WAIT_MS = 60_000;

type TokenWaiter = (token: string | null) => void;

export const useTurnstile = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<{ readonly api: TurnstileApi; readonly id: string } | null>(null);
  const tokenRef = useRef<string | null>(null);
  const waitersRef = useRef<TokenWaiter[]>([]);
  const [isInteractive, setIsInteractive] = useState(false);

  const settleWaiters = useCallback((token: string | null) => {
    const waiters = waitersRef.current;
    waitersRef.current = [];
    for (const waiter of waiters) {
      waiter(token);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const mountWidget = async () => {
      const api = await loadTurnstile();
      const container = containerRef.current;
      if (!isMounted || container === null) {
        return;
      }
      const id = api.render(container, {
        sitekey: TURNSTILE_SITE_KEY,
        language: "fr",
        appearance: "interaction-only",
        size: "flexible",
        "response-field": false,
        callback: (token) => {
          tokenRef.current = token;
          settleWaiters(token);
        },
        "expired-callback": () => {
          tokenRef.current = null;
        },
        "before-interactive-callback": () => setIsInteractive(true),
        "after-interactive-callback": () => setIsInteractive(false),
        "error-callback": () => {
          tokenRef.current = null;
          settleWaiters(null);
        },
      });
      widgetRef.current = { api, id };
    };
    mountWidget().catch(() => settleWaiters(null));
    return () => {
      isMounted = false;
      const widget = widgetRef.current;
      widget?.api.remove(widget.id);
      widgetRef.current = null;
    };
  }, [settleWaiters]);

  const getToken = useCallback((): Promise<string | null> => {
    if (tokenRef.current !== null) {
      return Promise.resolve(tokenRef.current);
    }
    return new Promise((resolve) => {
      const timeout = window.setTimeout(() => {
        waitersRef.current = waitersRef.current.filter((waiter) => waiter !== settle);
        resolve(null);
      }, TOKEN_WAIT_MS);
      const settle: TokenWaiter = (token) => {
        window.clearTimeout(timeout);
        resolve(token);
      };
      waitersRef.current.push(settle);
    });
  }, []);

  const captchaHeaders = useCallback(async () => {
    const token = await getToken();
    return token === null ? null : { [CAPTCHA_HEADER]: token };
  }, [getToken]);

  const reset = useCallback(() => {
    tokenRef.current = null;
    const widget = widgetRef.current;
    widget?.api.reset(widget.id);
  }, []);

  return { containerRef, isInteractive, captchaHeaders, reset };
};
