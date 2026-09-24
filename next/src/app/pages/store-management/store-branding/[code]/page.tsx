"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useI18n } from "@/components/i18n-provider";
import { RoleGate } from "@/components/role-gate";
import { addStoreLogo, getStore, removeStoreLogo } from "@/lib/api/store";
import type { StoreDetails, StoreLogo } from "@/lib/api/types";
import { canAccessStoreDetails } from "@/lib/auth/gate";

import styles from "@/components/store-page.module.css";

const ACCEPTED: Record<string, boolean> = {
  "image/png": true,
  "image/jpeg": true,
  "image/gif": true,
};

export default function StoreBrandingPage() {
  return (
    <RoleGate allow={canAccessStoreDetails}>
      <StoreBranding />
    </RoleGate>
  );
}

function StoreBranding() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams<{ code: string }>();
  const inputRef = useRef<HTMLInputElement>(null);
  const [store, setStore] = useState<StoreDetails | null>(null);
  const [logo, setLogo] = useState<StoreLogo | null>(null);
  const [preview, setPreview] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [showRemove, setShowRemove] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dropError, setDropError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!params.code) {
      return;
    }
    getStore(params.code)
      .then((res) => {
        setStore(res);
        setLogo(res.logo ?? null);
        setShowRemove(!!res.logo);
      })
      .finally(() => setLoading(false));
  }, [params.code]);

  function route(link: string) {
    if (!store?.code) {
      return;
    }
    router.push(`/pages/store-management/${link}/${store.code}`);
  }

  function checkFiles(files: FileList | File[]) {
    const file = files[0];
    if (!file) {
      return;
    }
    if (!ACCEPTED[file.type]) {
      setDropError(t("STORE_BRANDING.NOT_AN_IMAGE"));
      return;
    }
    if (files.length > 1) {
      setDropError(t("STORE_BRANDING.ONLY_ONE_IMAGE"));
      return;
    }
    setDropError("");
    setLogoFile(file);
    setShowRemove(true);
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  }

  async function saveLogo() {
    if (!logoFile) {
      return;
    }
    setSaving(true);
    try {
      await addStoreLogo(logoFile);
      setMessage(t("STORE_BRANDING.LOGO_SAVED"));
    } finally {
      setSaving(false);
    }
  }

  async function onRemove() {
    if (!store?.code) {
      return;
    }
    setShowRemove(false);
    setLogoFile(null);
    setPreview("");
    setLogo(null);
    await removeStoreLogo(store.code);
    setMessage(t("STORE_BRANDING.LOGO_REMOVED"));
  }

  if (loading) {
    return null;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t("STORE.STORE_INFORMATION")}</h1>
        <div className={styles.actions}>
          <select
            className={styles.select}
            value="store-branding"
            onChange={(event) => route(event.target.value)}
            aria-label={t("COMPONENTS.STORE_BRANDING")}
          >
            <option value="store-branding">{t("COMPONENTS.STORE_BRANDING")}</option>
            <option value="store-landing">{t("COMPONENTS.STORE_LANDING")}</option>
            <option value="store">{t("COMPONENTS.STORE_DETAILS")}</option>
          </select>
        </div>
      </header>
      {message ? <p className={`${styles.banner} ${styles.bannerSuccess}`}>{message}</p> : null}
      {dropError ? <p className={`${styles.banner} ${styles.bannerError}`}>{dropError}</p> : null}
      <div className={styles.card}>
        <div
          className={styles.drop}
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            checkFiles(event.dataTransfer.files);
          }}
        >
          {preview ? (
            // FileReader preview — not a remote image.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" />
          ) : logo?.path ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo.path} alt="" />
          ) : null}
          <div>{t("STORE_BRANDING.DROP_FILE")}</div>
        </div>
        <input
          ref={inputRef}
          className={styles.fileInput}
          type="file"
          accept="image/png,image/jpeg,image/gif"
          onChange={(event) => {
            if (event.target.files) {
              checkFiles(event.target.files);
            }
          }}
        />
        <div className={styles.actions}>
          {showRemove ? (
            <button type="button" className={styles.danger} onClick={() => void onRemove()}>
              {t("COMMON.REMOVE")}
            </button>
          ) : null}
          {logoFile ? (
            <button
              type="button"
              className={styles.primary}
              disabled={saving}
              onClick={() => void saveLogo()}
            >
              {saving ? "" : t("COMMON.SAVE")}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
