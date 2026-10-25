import type { PlatformRole } from "@passalio/shared";
import { configurationFr } from "../../fr-configuration";
import { ConfigurationGrid, ConfigurationSection } from "./configuration-section";

const text = configurationFr.profile;

const Detail = ({ label, value }: { readonly label: string; readonly value: string }) => (
  <div className="flex flex-col gap-1">
    <dt className="text-sm font-semibold lg:text-[13px]">{label}</dt>
    <dd className="text-base break-words text-[#334155] lg:text-[13px]">{value}</dd>
  </div>
);

export const ProfileSection = ({
  member,
  role,
}: {
  readonly member: { readonly name: string; readonly email: string };
  readonly role: PlatformRole | null;
}) => (
  <ConfigurationSection title={text.title} hint={text.hint}>
    <ConfigurationGrid>
      <dl className="contents">
        <Detail label={text.name} value={member.name} />
        <Detail label={text.email} value={member.email} />
        {role === null ? null : <Detail label={text.role} value={text.roles[role]} />}
      </dl>
    </ConfigurationGrid>
  </ConfigurationSection>
);
