import { useCallback, useRef, useState } from 'react';

import type { MediaItem } from '@/features/seller/media-strip';
import type { PickedFile } from '@/features/seller/pick-media';
import type { UploadKind } from '@/features/seller/types';
import { uploadFile } from '@/features/seller/upload';

let nextKey = 0;

// Photos and videos in a form. Each file starts uploading as soon as it is
// picked, so saving is quick, and the form waits for uploads to finish.
export function useMediaUploads(initial: MediaItem[] = [], uploadKind?: UploadKind) {
  const [items, setItems] = useState<MediaItem[]>(initial);
  const removed = useRef(new Set<string>());

  const update = useCallback((key: string, change: Partial<MediaItem>) => {
    setItems((current) => current.map((item) => (item.key === key ? { ...item, ...change } : item)));
  }, []);

  const add = useCallback(
    (kind: MediaItem['kind'], files: PickedFile[]) => {
      const added = files.map((file) => ({
        file,
        item: { key: `local-${nextKey++}`, kind, localUri: file.uri, progress: 0 } satisfies MediaItem,
      }));
      // A product's video goes last, after its photos.
      setItems((current) => {
        const next = [...current, ...added.map(({ item }) => item)];
        return [...next.filter((item) => item.kind === 'image'), ...next.filter((item) => item.kind === 'video')];
      });
      for (const { file, item } of added) {
        uploadFile(uploadKind ?? kind, file, (progress) => update(item.key, { progress }))
          .then((publicId) => {
            if (!removed.current.has(item.key)) update(item.key, { publicId, progress: 1 });
          })
          .catch((error: unknown) =>
            update(item.key, { error: error instanceof Error ? error.message : 'The upload failed' }),
          );
      }
    },
    [update, uploadKind],
  );

  const remove = useCallback((key: string) => {
    removed.current.add(key);
    setItems((current) => current.filter((item) => item.key !== key));
  }, []);

  const uploading = items.some((item) => !item.publicId && !item.error);
  const failed = items.some((item) => item.error);
  const uploaded = items.flatMap((item) => (item.publicId ? [{ kind: item.kind, publicId: item.publicId }] : []));

  return { items, add, remove, uploading, failed, uploaded };
}
