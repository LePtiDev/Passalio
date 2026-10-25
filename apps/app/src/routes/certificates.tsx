import { createRoute } from "@tanstack/react-router";
import * as z from "zod";
import { CertificateFormScreen, SignedScreen, SignScreen } from "@/contexts/compliance";
import { signedInRoute } from "./signed-in-layout";

const ID = z.string().max(64);

const visitParams = z.object({ interventionId: ID });

const equipmentParams = z.object({ interventionId: ID, equipmentId: ID });

export const certificateFormRoute = createRoute({
  getParentRoute: () => signedInRoute,
  path: "/passages/$interventionId/certificat/$equipmentId",
  params: { parse: (params) => equipmentParams.parse(params) },
  component: function CertificateFormRouteScreen() {
    const { interventionId, equipmentId } = certificateFormRoute.useParams();
    return (
      <CertificateFormScreen
        key={equipmentId}
        interventionId={interventionId}
        equipmentId={equipmentId}
      />
    );
  },
});

export const certificateSignRoute = createRoute({
  getParentRoute: () => signedInRoute,
  path: "/passages/$interventionId/signature",
  params: { parse: (params) => visitParams.parse(params) },
  component: function CertificateSignRouteScreen() {
    const { interventionId } = certificateSignRoute.useParams();
    return <SignScreen interventionId={interventionId} />;
  },
});

export const signedCertificatesRoute = createRoute({
  getParentRoute: () => signedInRoute,
  path: "/passages/$interventionId/certificats-signes",
  params: { parse: (params) => visitParams.parse(params) },
  component: function SignedCertificatesRouteScreen() {
    const { interventionId } = signedCertificatesRoute.useParams();
    return <SignedScreen interventionId={interventionId} />;
  },
});
