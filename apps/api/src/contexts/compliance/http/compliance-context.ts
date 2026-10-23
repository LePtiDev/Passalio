import type { Variables } from "../../../env";
import type { ComplianceDependencies } from "../domain/compliance-ports";
import { createComplianceDependencies } from "../infrastructure/compliance-dependencies";

export const complianceDependencies = (variables: Variables): ComplianceDependencies =>
  createComplianceDependencies(variables.database);
