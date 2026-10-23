import { zodResolver } from "@hookform/resolvers/zod";
import type { EquipmentKind, EquipmentPhotoKind } from "@passalio/shared";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { FormSkeleton } from "@/components/page-skeleton";
import { useLocalSession } from "@/lib/db/local-database-context";
import type { EquipmentRecord, SiteRecord } from "@/lib/db/local-records";
import { customerNameOf } from "../../customer-view";
import { addEquipment, addEquipmentPhoto } from "../../equipment-store";
import { BUILDING_TYPE_LABELS, customersFr } from "../../fr";
import { useCustomerFile, type CustomerFile } from "../../hooks/use-customer-file";
import { useOfferedKinds } from "../../hooks/use-offered-kinds";
import { CustomerNotFound } from "../file/customer-not-found";
import { Fieldset, FormShell } from "../form/form-shell";
import { FlueFields, HeatPumpFields, IdentityFields } from "./equipment-detail-fields";
import {
  emptyEquipmentForm,
  equipmentFormSchema,
  NO_REPLACEMENT,
  isHeatPumpKind,
  replacedEquipmentIdOf,
  toEquipmentFields,
  type EquipmentFormValues,
} from "./equipment-form-schema";
import { EnergyField, EquipmentKindField } from "./equipment-kind-field";
import { EquipmentPhotoTiles, NO_PHOTOS, type EquipmentPhotos } from "./equipment-photo-tiles";
import { InstallationFields } from "./installation-fields";
import { LastVisitFields } from "./last-visit-fields";

const text = customersFr.equipmentForm;

const PHOTO_KINDS: readonly EquipmentPhotoKind[] = ["plate", "overview"];

type NewEquipmentFormProps = {
  readonly file: CustomerFile;
  readonly site: SiteRecord;
  readonly replacesEquipmentId: string | undefined;
};

const siteLineOf = (name: string, site: SiteRecord) =>
  `${name} · ${site.label ?? BUILDING_TYPE_LABELS[site.buildingType]}, ${site.address}`;

const noteOf = (
  kind: EquipmentKind | null,
  replaced: EquipmentRecord | undefined,
  isReplacing: boolean,
) => {
  if (!isReplacing) {
    return text.note;
  }
  return kind === null || replaced === undefined
    ? text.replaceNote
    : text.replaceNoteOf(kind, replaced.kind);
};

const NewEquipmentForm = ({ file, site, replacesEquipmentId }: NewEquipmentFormProps) => {
  const { database, actor } = useLocalSession();
  const navigate = useNavigate();
  const kinds = useOfferedKinds();
  const [photos, setPhotos] = useState<EquipmentPhotos>(NO_PHOTOS);
  const form = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentFormSchema),
    defaultValues: emptyEquipmentForm(replacesEquipmentId),
  });
  const [kind, isInstalledByUs, replacesEquipmentChoice] = useWatch({
    control: form.control,
    name: ["kind", "isInstalledByUs", "replacesEquipmentId"],
  });
  const isReplacing = isInstalledByUs && replacesEquipmentChoice !== NO_REPLACEMENT;
  const candidates = useMemo<readonly EquipmentRecord[]>(
    () =>
      file.equipments.filter(
        (equipment) => equipment.siteId === site.id && equipment.status === "active",
      ),
    [file.equipments, site.id],
  );
  const backToFile = useCallback(() => {
    void navigate({ to: "/clients/$customerId", params: { customerId: file.customer.id } });
  }, [navigate, file.customer.id]);
  const submit = form.handleSubmit(async (values) => {
    try {
      const replacedId = replacedEquipmentIdOf(values);
      const equipmentId = await addEquipment(database, actor, {
        siteId: site.id,
        equipment: toEquipmentFields(values),
        replacesEquipmentId: replacedId,
      });
      await Promise.all(
        PHOTO_KINDS.flatMap((photoKind) => {
          const photo = photos[photoKind];
          return photo === null
            ? []
            : [
                addEquipmentPhoto(database, actor, {
                  equipmentId,
                  kind: photoKind,
                  blob: photo.file,
                }),
              ];
        }),
      );
      toast.success(
        replacedId === undefined
          ? customersFr.toasts.equipmentCreated
          : customersFr.toasts.equipmentReplaced,
      );
      backToFile();
    } catch {
      toast.error(customersFr.form.errors.saveFailed);
    }
  });
  const name = customerNameOf(file.customer);
  const trail = useMemo(
    () => [
      { label: customersFr.list.title, to: "/clients" as const },
      { label: name },
      { label: text.title },
    ],
    [name],
  );
  return (
    <FormProvider {...form}>
      <FormShell
        title={text.title}
        note={noteOf(
          kind,
          candidates.find(({ id }) => id === replacesEquipmentChoice),
          isReplacing,
        )}
        trail={trail}
        primaryLabel={text.save}
        isSubmitting={form.formState.isSubmitting}
        onSubmit={submit}
        onCancel={backToFile}
      >
        <EquipmentPhotoTiles photos={photos} onChange={setPhotos} />
        <Fieldset title={text.section} text={siteLineOf(name, site)}>
          <EquipmentKindField kinds={kinds} />
          <EnergyField />
          <IdentityFields />
          {isHeatPumpKind(kind) ? <HeatPumpFields /> : null}
        </Fieldset>
        {kind === null || isHeatPumpKind(kind) ? null : <FlueFields />}
        <InstallationFields candidates={candidates} />
        <LastVisitFields />
      </FormShell>
    </FormProvider>
  );
};

type NewEquipmentScreenProps = {
  readonly customerId: string;
  readonly siteId: string;
  readonly replacesEquipmentId: string | undefined;
};

export const NewEquipmentScreen = ({
  customerId,
  siteId,
  replacesEquipmentId,
}: NewEquipmentScreenProps) => {
  const file = useCustomerFile(customerId);
  if (file === undefined) {
    return (
      <div className="mx-auto w-full max-w-[600px] p-4 lg:py-8">
        <FormSkeleton />
      </div>
    );
  }
  const site = file?.sites.find(({ id }) => id === siteId);
  if (file === null || site === undefined) {
    return <CustomerNotFound />;
  }
  return <NewEquipmentForm file={file} site={site} replacesEquipmentId={replacesEquipmentId} />;
};
