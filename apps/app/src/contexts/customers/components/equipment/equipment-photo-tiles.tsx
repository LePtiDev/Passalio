import type { EquipmentPhotoKind } from "@passalio/shared";
import { Camera, ScanText, X, type LucideIcon } from "lucide-react";
import { useCallback, useState, type ChangeEvent } from "react";
import { customersFr, PHOTO_KIND_LABELS } from "../../fr";
import { Fieldset } from "../form/form-shell";
import { photoFileProblemOf, type PhotoFileProblem } from "./photo-file-check";

const text = customersFr.equipmentForm;

export type PickedPhoto = { readonly file: File; readonly previewUrl: string };

export type EquipmentPhotos = Readonly<Record<EquipmentPhotoKind, PickedPhoto | null>>;

export const NO_PHOTOS: EquipmentPhotos = { plate: null, overview: null };

const TILE_ICONS: Readonly<Record<EquipmentPhotoKind, LucideIcon>> = {
  plate: ScanText,
  overview: Camera,
};

const PHOTO_KINDS: readonly EquipmentPhotoKind[] = ["plate", "overview"];

const FilledTile = ({
  kind,
  photo,
  onRemove,
}: {
  readonly kind: EquipmentPhotoKind;
  readonly photo: PickedPhoto;
  readonly onRemove: (kind: EquipmentPhotoKind) => void;
}) => {
  const remove = useCallback(() => onRemove(kind), [kind, onRemove]);
  return (
    <div className="flex flex-col gap-1.5">
      <span className="relative block aspect-[4/3] overflow-hidden rounded-[12px] border border-[#E3E8EF] bg-[#EEF3F8]">
        <img
          src={photo.previewUrl}
          alt={PHOTO_KIND_LABELS[kind]}
          className="size-full object-cover"
        />
        <button
          type="button"
          onClick={remove}
          aria-label={`${text.removePhoto} : ${PHOTO_KIND_LABELS[kind]}`}
          className="absolute top-1 right-1 flex size-12 items-center justify-center"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-white/95 shadow-sm">
            <X aria-hidden="true" className="size-4" />
          </span>
        </button>
      </span>
      <span className="text-[13px] font-medium text-[#475569]">{PHOTO_KIND_LABELS[kind]}</span>
    </div>
  );
};

const EmptyTile = ({
  kind,
  onPick,
}: {
  readonly kind: EquipmentPhotoKind;
  readonly onPick: (kind: EquipmentPhotoKind, file: File) => void;
}) => {
  const Icon = TILE_ICONS[kind];
  const pick = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.item(0);
      if (file !== null && file !== undefined) {
        onPick(kind, file);
      }
    },
    [kind, onPick],
  );
  return (
    <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[12px] border border-dashed border-[#B9C6D3] bg-[#F7F9FB] text-[15px] font-semibold focus-within:ring-[3px] focus-within:ring-[#0E7C5A]/20">
      <Icon aria-hidden="true" className="size-6 text-[#0E7C5A]" />
      {PHOTO_KIND_LABELS[kind]}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={pick}
      />
    </label>
  );
};

type EquipmentPhotoTilesProps = {
  readonly photos: EquipmentPhotos;
  readonly onChange: (photos: EquipmentPhotos) => void;
};

export const EquipmentPhotoTiles = ({ photos, onChange }: EquipmentPhotoTilesProps) => {
  const [problem, setProblem] = useState<PhotoFileProblem | null>(null);
  const pick = useCallback(
    (kind: EquipmentPhotoKind, file: File) => {
      const fileProblem = photoFileProblemOf(file);
      setProblem(fileProblem);
      if (fileProblem === null) {
        onChange({ ...photos, [kind]: { file, previewUrl: URL.createObjectURL(file) } });
      }
    },
    [photos, onChange],
  );
  const remove = useCallback(
    (kind: EquipmentPhotoKind) => {
      const photo = photos[kind];
      if (photo !== null) {
        URL.revokeObjectURL(photo.previewUrl);
      }
      onChange({ ...photos, [kind]: null });
    },
    [photos, onChange],
  );
  const hasPhoto = PHOTO_KINDS.some((kind) => photos[kind] !== null);
  return (
    <Fieldset
      title={text.photos}
      text={hasPhoto ? undefined : text.photosText}
      className="lg:hidden"
    >
      <div className="grid grid-cols-2 gap-3">
        {PHOTO_KINDS.map((kind) => {
          const photo = photos[kind];
          return photo === null ? (
            <EmptyTile key={kind} kind={kind} onPick={pick} />
          ) : (
            <FilledTile key={kind} kind={kind} photo={photo} onRemove={remove} />
          );
        })}
      </div>
      {problem === null ? null : (
        <p role="alert" className="text-[13px] font-medium text-destructive">
          {text.photoProblems[problem]}
        </p>
      )}
    </Fieldset>
  );
};
