import type { CertificateFonts } from "@passalio/pdf";
import boldUrl from "@passalio/pdf/fonts/PlusJakartaSans-Bold.ttf?url";
import extraboldUrl from "@passalio/pdf/fonts/PlusJakartaSans-ExtraBold.ttf?url";
import regularUrl from "@passalio/pdf/fonts/PlusJakartaSans-Regular.ttf?url";
import semiboldUrl from "@passalio/pdf/fonts/PlusJakartaSans-SemiBold.ttf?url";

const fontBytes = async (url: string) => new Uint8Array(await (await fetch(url)).arrayBuffer());

let loaded: Promise<CertificateFonts> | null = null;

const loadFonts = async (): Promise<CertificateFonts> => {
  const [regular, semibold, bold, extrabold] = await Promise.all([
    fontBytes(regularUrl),
    fontBytes(semiboldUrl),
    fontBytes(boldUrl),
    fontBytes(extraboldUrl),
  ]);
  return { regular, semibold, bold, extrabold };
};

export const certificateFonts = (): Promise<CertificateFonts> => {
  loaded ??= loadFonts().catch((error: unknown) => {
    loaded = null;
    throw error;
  });
  return loaded;
};
