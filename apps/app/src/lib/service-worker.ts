import { registerSW } from "virtual:pwa-register";

const UPDATE_CHECK_INTERVAL_MS = 30 * 60 * 1000;

const checkForUpdate = (registration: ServiceWorkerRegistration) => {
  if (navigator.onLine) {
    void registration.update();
  }
};

const watchForUpdates = (registration: ServiceWorkerRegistration | undefined) => {
  if (registration === undefined) {
    return;
  }
  setInterval(() => checkForUpdate(registration), UPDATE_CHECK_INTERVAL_MS);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      checkForUpdate(registration);
    }
  });
};

export const registerServiceWorker = () => {
  void registerSW({
    immediate: true,
    onRegisteredSW: (_url, registration) => watchForUpdates(registration),
  });
};
