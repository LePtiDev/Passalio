import { useLiveQuery } from "dexie-react-hooks";
import { useLocalSession } from "@/lib/db/local-database-context";

const PREVIEW_URLS = new Map<string, string>();

const previewUrlOf = (photoId: string, blob: Blob) => {
  const known = PREVIEW_URLS.get(photoId);
  if (known !== undefined) {
    return known;
  }
  const url = URL.createObjectURL(blob);
  PREVIEW_URLS.set(photoId, url);
  return url;
};

export const usePhotoUrl = (photoId: string) => {
  const { database } = useLocalSession();
  return (
    useLiveQuery(async () => {
      const pending = await database.pendingPhotos.get(photoId);
      return pending === undefined ? `/api/photos/${photoId}` : previewUrlOf(photoId, pending.blob);
    }, [database, photoId]) ?? null
  );
};
