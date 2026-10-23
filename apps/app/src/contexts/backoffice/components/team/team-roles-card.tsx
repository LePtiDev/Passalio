import { PLATFORM_ROLES } from "@passalio/shared";
import { PLATFORM_ROLE_DESCRIPTIONS, teamFr } from "../../team-fr";
import { RoleBadge } from "./role-badge";

export const TeamRolesCard = () => (
  <section className="hidden flex-col gap-3 rounded-xl border border-[#E3E8EF] bg-[#F7F9FB] p-4 lg:flex">
    <h2 className="text-[15px] font-bold">{teamFr.rolesTitle}</h2>
    <ul className="grid grid-cols-3 gap-4">
      {PLATFORM_ROLES.map((role) => (
        <li key={role} className="flex flex-col items-start gap-1">
          <RoleBadge role={role} />
          <span className="text-[13px] leading-snug text-[#475569]">
            {PLATFORM_ROLE_DESCRIPTIONS[role]}
          </span>
        </li>
      ))}
    </ul>
    <p className="text-xs text-[#64748B]">{teamFr.rolesNote}</p>
  </section>
);
