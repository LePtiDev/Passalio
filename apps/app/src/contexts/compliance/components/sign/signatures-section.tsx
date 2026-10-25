import { useCallback } from "react";
import { HINT_TEXT_CLASS } from "@/components/field-styles";
import { Checkbox } from "@/components/ui/checkbox";
import { customerNameOf, Fieldset } from "@/contexts/customers";
import { complianceFr } from "../../fr";
import type { CertificateVisit } from "../../hooks/use-certificate-visit";
import type { SignaturesState, SignIssues } from "../../sign-issues";
import { SignatureField } from "./signature-field";

const text = complianceFr.sign;

const ABSENT_ID = "certificate-customer-absent";

type SignaturesSectionProps = {
  readonly visit: CertificateVisit;
  readonly signatures: SignaturesState;
  readonly issues: SignIssues;
  readonly onChange: (change: (state: SignaturesState) => SignaturesState) => void;
};

export const SignaturesSection = ({
  visit,
  signatures,
  issues,
  onChange,
}: SignaturesSectionProps) => {
  const customerName = customerNameOf(visit.customer);
  const signTechnician = useCallback(
    (image: string | null) => onChange((state) => ({ ...state, technicianSignature: image })),
    [onChange],
  );
  const signCustomer = useCallback(
    (image: string | null) => onChange((state) => ({ ...state, customerSignature: image })),
    [onChange],
  );
  const toggleAbsent = useCallback(
    (checked: boolean | "indeterminate") =>
      onChange((state) => ({
        ...state,
        isCustomerAbsent: checked === true,
        customerSignature: checked === true ? null : state.customerSignature,
      })),
    [onChange],
  );
  return (
    <Fieldset title={text.signatures}>
      <SignatureField
        id="certificate-technician-signature"
        label={text.technician}
        padLabel={text.technicianPad(visit.technicianName)}
        signerName={visit.technicianName}
        actionLabel={text.redo}
        value={signatures.technicianSignature}
        savedImage={visit.savedSignature}
        error={issues.technicianSignature}
        onChange={signTechnician}
      />
      <SignatureField
        id="certificate-customer-signature"
        label={text.customer}
        padLabel={text.customerPad(customerName)}
        signerName={customerName}
        actionLabel={text.clear}
        value={signatures.customerSignature}
        savedImage={null}
        isDisabled={signatures.isCustomerAbsent}
        error={issues.customerSignature}
        onChange={signCustomer}
      />
      <label htmlFor={ABSENT_ID} className="flex min-h-12 items-start gap-3 py-1 lg:min-h-8">
        <Checkbox
          id={ABSENT_ID}
          checked={signatures.isCustomerAbsent}
          onCheckedChange={toggleAbsent}
          className="mt-0.5 size-5 data-[state=checked]:border-[#0E7C5A] data-[state=checked]:bg-[#0E7C5A] lg:size-4"
        />
        <span className="flex flex-col gap-0.5">
          <span className="text-[15px] font-medium lg:text-[13px]">{text.customerAbsent}</span>
          <span className={HINT_TEXT_CLASS}>{text.customerAbsentText}</span>
        </span>
      </label>
    </Fieldset>
  );
};
