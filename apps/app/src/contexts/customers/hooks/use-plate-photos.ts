import type { EquipmentKind, PlateReadingFields } from "@passalio/shared";
import { useCallback, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { EquipmentFormValues } from "../components/equipment/equipment-form-schema";
import { NO_PHOTOS, type EquipmentPhotos } from "../components/equipment/equipment-photo-tiles";
import { mergePlateReading } from "../plate-reading";
import { usePlateReading } from "./use-plate-reading";

export const usePlatePhotos = (
  form: UseFormReturn<EquipmentFormValues>,
  kinds: readonly EquipmentKind[],
) => {
  const [photos, setPhotos] = useState<EquipmentPhotos>(NO_PHOTOS);
  const applyReading = useCallback(
    (fields: PlateReadingFields) => {
      const merge = mergePlateReading(form.getValues(), fields, kinds);
      form.reset(
        { ...form.getValues(), ...merge.defaults, ...merge.values },
        { keepDefaultValues: true, keepDirty: true, keepErrors: true, keepTouched: true },
      );
      return merge;
    },
    [form, kinds],
  );
  const plateReading = usePlateReading(applyReading);
  const { start: startReading, cancel: cancelReading } = plateReading;
  const changePhotos = useCallback(
    (next: EquipmentPhotos) => {
      setPhotos(next);
      if (next.plate === null) {
        cancelReading();
      } else if (next.plate !== photos.plate) {
        void startReading(next.plate.file);
      }
    },
    [photos.plate, startReading, cancelReading],
  );
  const retakePlate = useCallback(
    (file: File) => {
      if (photos.plate !== null) {
        URL.revokeObjectURL(photos.plate.previewUrl);
      }
      changePhotos({ ...photos, plate: { file, previewUrl: URL.createObjectURL(file) } });
    },
    [photos, changePhotos],
  );
  return { photos, plateReading, changePhotos, retakePlate };
};
