import { configurationFr } from "../../fr-configuration";
import { ConfigurationTextarea } from "./configuration-fields";
import { ConfigurationSection } from "./configuration-section";

const text = configurationFr.signature;

export const SignatureSection = () => (
  <ConfigurationSection title={text.title} hint={text.hint}>
    <ConfigurationTextarea label={text.label} />
  </ConfigurationSection>
);
