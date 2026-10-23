import { createRoute } from "@tanstack/react-router";
import * as z from "zod";
import {
  CustomerFileScreen,
  CustomerListScreen,
  EditCustomerScreen,
  NewCustomerScreen,
  NewEquipmentScreen,
  NewSiteScreen,
} from "@/contexts/customers";
import { signedInRoute } from "./signed-in-layout";

const newCustomerSearch = z.object({ nom: z.string().max(120).optional() });

const newEquipmentSearch = z.object({
  lieu: z.string().max(64),
  remplace: z.string().max(64).optional(),
});

export const customersRoute = createRoute({
  getParentRoute: () => signedInRoute,
  path: "/clients",
  component: CustomerListScreen,
});

export const newCustomerRoute = createRoute({
  getParentRoute: () => signedInRoute,
  path: "/clients/nouveau",
  validateSearch: newCustomerSearch,
  component: function NewCustomerRouteScreen() {
    const { nom } = newCustomerRoute.useSearch();
    return <NewCustomerScreen initialName={nom ?? ""} />;
  },
});

export const customerRoute = createRoute({
  getParentRoute: () => signedInRoute,
  path: "/clients/$customerId",
  component: function CustomerRouteScreen() {
    const { customerId } = customerRoute.useParams();
    return <CustomerFileScreen customerId={customerId} />;
  },
});

export const editCustomerRoute = createRoute({
  getParentRoute: () => signedInRoute,
  path: "/clients/$customerId/modifier",
  component: function EditCustomerRouteScreen() {
    const { customerId } = editCustomerRoute.useParams();
    return <EditCustomerScreen customerId={customerId} />;
  },
});

export const newSiteRoute = createRoute({
  getParentRoute: () => signedInRoute,
  path: "/clients/$customerId/lieux/nouveau",
  component: function NewSiteRouteScreen() {
    const { customerId } = newSiteRoute.useParams();
    return <NewSiteScreen customerId={customerId} />;
  },
});

export const newEquipmentRoute = createRoute({
  getParentRoute: () => signedInRoute,
  path: "/clients/$customerId/appareils/nouveau",
  validateSearch: newEquipmentSearch,
  component: function NewEquipmentRouteScreen() {
    const { customerId } = newEquipmentRoute.useParams();
    const { lieu, remplace } = newEquipmentRoute.useSearch();
    return (
      <NewEquipmentScreen customerId={customerId} siteId={lieu} replacesEquipmentId={remplace} />
    );
  },
});
