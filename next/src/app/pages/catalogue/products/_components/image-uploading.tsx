"use client";

import { useRef, useState } from "react";

import { useI18n } from "@/components/i18n-provider";
import { client } from "@/lib/api/client";
import type { ProductImage } from "@/lib/api/product-children";

import styles from "../product-children.module.css";

const EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];
const MAX_COUNT = 10;
const MAX_SIZE_BYTES = 4 * 1024 * 1024;

export function ImageUploading({
  images,
  addImageUrl,
  onRemove,
  onUpdate,
  onError,
  onSuccess,
  onFileAdded,
}: {
  images: ProductImage[];
  addImageUrl: string;
  onRemove: (imageId: string | number) => void;
  onUpdate: (event: { id: string | number; position: number }) => void;
  onError: (code: string) => void;
  onSuccess: () => void;
  onFileAdded: () => void;
}) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<string>("");
  const dragIndex = useRef<number | null>(null);

  async function upload(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!EXTENSIONS.includes(ext)) {
      onError("FILE_EXTENSIONS");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      onError("FILE_MAX_SIZE");
      return;
    }
    if (images.length >= MAX_COUNT) {
      onError("FILE_MAX_COUNT");
      return;
    }

    onFileAdded();
    setProgress(`${file.name} 0%`);
    const form = new FormData();
    form.append("file", file);
    const path = addImageUrl.replace(client.getBaseUrl(), "");
    try {
      await client.post(path || addImageUrl, form);
      setProgress(`${file.name} 100%`);
      window.setTimeout(() => {
        onSuccess();
        setProgress("");
      }, 2000);
    } catch {
      onError("ERROR");
      setProgress("");
    }
  }

  return (
    <div className={styles.uploader}>
      <div
        className={styles.dropzone}
        data-testid="image-dropzone"
        onDragOver={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onDrop={(event) => {
          event.preventDefault();
          event.stopPropagation();
          Array.from(event.dataTransfer.files).forEach((file) => {
            void upload(file);
          });
        }}
      >
        <div>{t("COMMON.DRAG_DROP")}</div>
        <div>{t("COMMON.OR")}</div>
        <button
          type="button"
          className={styles.primary}
          onClick={() => inputRef.current?.click()}
        >
          {t("COMMON.BROWSE_FILES")}
        </button>
        <input
          ref={inputRef}
          type="file"
          hidden
          accept=".jpg,.jpeg,.png,.gif,.webp"
          multiple
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            files.forEach((file) => void upload(file));
            event.target.value = "";
          }}
        />
        {progress ? <p>{progress}</p> : null}
      </div>
      <div className={styles.images}>
        {images.map((image, index) => (
          <div
            key={String(image.id)}
            className={styles.imageCard}
            draggable
            onDragStart={() => {
              dragIndex.current = index;
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              const from = dragIndex.current;
              dragIndex.current = null;
              if (from === null || from === index) {
                return;
              }
              onUpdate({ id: images[from].id, position: index + 1 });
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.imageUrl} alt={image.path ?? image.imageName ?? ""} />
            <button
              type="button"
              className={styles.removeImage}
              aria-label={t("COMMON.REMOVE")}
              onClick={() => onRemove(image.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
