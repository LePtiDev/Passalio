import {
  CALL_OUTCOMES,
  CERTIFICATE_VOLUMES,
  DECISION_MAKERS,
  INTEREST_LEVELS,
  NEXT_ACTIONS,
  NOTIFY_MODES,
  PROSPECT_TEAM_SIZES,
  TOOL_KINDS,
} from "@passalio/shared";
import { callsFr } from "../../fr-calls";
import { optionsOf } from "./choice-field";

const qualification = callsFr.qualification;

export const OUTCOME_OPTIONS = optionsOf(CALL_OUTCOMES, callsFr.outcomes);

export const NEXT_ACTION_OPTIONS = optionsOf(NEXT_ACTIONS, callsFr.nextActions);

export const NOTIFY_OPTIONS = optionsOf(NOTIFY_MODES, callsFr.notify);

export const INTEREST_OPTIONS = optionsOf(INTEREST_LEVELS, qualification.interest.options);

export const TEAM_SIZE_OPTIONS = optionsOf(PROSPECT_TEAM_SIZES, qualification.teamSize.options);

export const TOOL_KIND_OPTIONS = optionsOf(TOOL_KINDS, qualification.toolKind.options);

export const CERTIFICATE_VOLUME_OPTIONS = optionsOf(
  CERTIFICATE_VOLUMES,
  qualification.certificateVolume.options,
);

export const DECISION_MAKER_OPTIONS = optionsOf(
  DECISION_MAKERS,
  qualification.decisionMaker.options,
);
