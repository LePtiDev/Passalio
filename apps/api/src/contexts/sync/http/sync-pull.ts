import type { Actor, ChangeCursor, ChangePage } from "@passalio/shared";
import { complianceDependencies, pullDocumentChanges } from "../../compliance";
import { customerDependencies, pullCustomerChanges } from "../../customers";
import { pullInterventionChanges, schedulingDependencies } from "../../scheduling";
import type { Bindings, Variables } from "../../../env";
import type { SyncCursors } from "./sync-cursor";

const cursorOf = <T>(table: string, page: ChangePage<T>): SyncCursors =>
  page.cursor === undefined ? {} : { [table]: page.cursor satisfies ChangeCursor };

export const pullSyncChanges =
  (variables: Variables, bindings: Bindings) => async (actor: Actor, cursors: SyncCursors) => {
    const [customerPage, interventions, documents] = await Promise.all([
      pullCustomerChanges(customerDependencies(variables, bindings))(actor, cursors),
      pullInterventionChanges(schedulingDependencies(variables))(actor, cursors.interventions),
      pullDocumentChanges(complianceDependencies(variables))(actor, cursors.documents),
    ]);
    return {
      changes: {
        ...customerPage.changes,
        interventions: interventions.rows,
        documents: documents.rows,
      },
      cursors: {
        ...customerPage.cursors,
        ...cursorOf("interventions", interventions),
        ...cursorOf("documents", documents),
      },
      hasMore: customerPage.hasMore || interventions.hasMore || documents.hasMore,
    };
  };
