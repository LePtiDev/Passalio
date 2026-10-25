import type { CertificateFonts } from "@passalio/pdf";
import bold from "@passalio/pdf/fonts/PlusJakartaSans-Bold.ttf";
import extrabold from "@passalio/pdf/fonts/PlusJakartaSans-ExtraBold.ttf";
import regular from "@passalio/pdf/fonts/PlusJakartaSans-Regular.ttf";
import semibold from "@passalio/pdf/fonts/PlusJakartaSans-SemiBold.ttf";

export const certificateFonts = (): CertificateFonts => ({
  regular: new Uint8Array(regular),
  semibold: new Uint8Array(semibold),
  bold: new Uint8Array(bold),
  extrabold: new Uint8Array(extrabold),
});
