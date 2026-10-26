import { NOTIFY_MODES } from "@passalio/shared";
import { callsFr } from "../../fr-calls";
import { configurationFr } from "../../fr-configuration";
import { ConfigurationSelectField, ConfigurationTextField } from "./configuration-fields";
import { ConfigurationGrid, ConfigurationSection } from "./configuration-section";

const text = configurationFr.reminders;

const NOTIFY_OPTIONS = NOTIFY_MODES.map((mode) => ({ value: mode, label: callsFr.notify[mode] }));

export const RemindersSection = () => (
  <ConfigurationSection title={text.title} hint={text.hint}>
    <ConfigurationGrid>
      <ConfigurationSelectField
        name="reminderNotify"
        label={text.notify}
        options={NOTIFY_OPTIONS}
      />
      <ConfigurationTextField
        name="reminderAddress"
        label={text.address}
        type="email"
        hint={text.addressHint}
      />
    </ConfigurationGrid>
  </ConfigurationSection>
);
