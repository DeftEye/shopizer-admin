"use client";

import { useCallback, useEffect, useState } from "react";

import styles from "@/components/category-page.module.css";
import { useI18n } from "@/components/i18n-provider";
import {
  listCategories,
  readApiErrorMessage,
  updateHierarchy,
} from "@/lib/api/categories";
import { getLang, getMerchant } from "@/lib/auth/session";
import {
  decorateHierarchy,
  moveCategoryNode,
} from "@/lib/catalogue/category-form";
import type { CategoryNode } from "@/lib/catalogue/types";

function TreeBranch({
  nodes,
  onMove,
}: {
  nodes: CategoryNode[];
  onMove: (childId: number, parentId: number) => void;
}) {
  const [overId, setOverId] = useState<number | null>(null);

  return (
    <ul className={styles.tree}>
      {nodes.map((node) => (
        <li key={node.id} className={styles.treeItem}>
          <div
            className={styles.treeNode}
            draggable
            data-over={overId === node.id ? "true" : "false"}
            onDragStart={(event) => {
              event.dataTransfer.setData("text/plain", String(node.id));
              event.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setOverId(node.id);
            }}
            onDragLeave={() => setOverId(null)}
            onDrop={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setOverId(null);
              const childId = Number(event.dataTransfer.getData("text/plain"));
              if (!Number.isFinite(childId) || childId === node.id) {
                return;
              }
              onMove(childId, node.id);
            }}
          >
            {node.name || node.code}
          </div>
          {node.children?.length ? (
            <TreeBranch nodes={node.children} onMove={onMove} />
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export default function CategoriesHierarchyPage() {
  const { t, lang } = useI18n();
  const [nodes, setNodes] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [rootOver, setRootOver] = useState(false);
  const [banner, setBanner] = useState<{
    kind: "error" | "success";
    text: string;
  } | null>(null);

  const fetchTree = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listCategories({
        store: getMerchant() ?? "",
        lang: getLang(),
        page: 0,
      });
      setNodes(decorateHierarchy(result.categories ?? []));
    } catch (error) {
      setBanner({
        kind: "error",
        text: readApiErrorMessage(error, t("COMMON.INTERNAL_SERVER_ERROR")),
      });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void fetchTree();
    }, 0);
    return () => window.clearTimeout(id);
  }, [fetchTree, lang]);

  async function onMove(childId: number, parentId: number) {
    const previous = nodes;
    setNodes(moveCategoryNode(nodes, childId, parentId));
    try {
      await updateHierarchy(childId, parentId);
      setBanner({ kind: "success", text: t("CATEGORY.HIERARCHY_UPDATED") });
    } catch (error) {
      setNodes(previous);
      setBanner({
        kind: "error",
        text: readApiErrorMessage(error, t("COMMON.INTERNAL_SERVER_ERROR")),
      });
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t("COMPONENTS.CATEGORIES_HIERARCHY")}</h1>
      </header>
      <section className={styles.card}>
        {banner ? (
          <p
            className={`${styles.banner} ${
              banner.kind === "error" ? styles.bannerError : styles.bannerSuccess
            }`}
            role={banner.kind === "error" ? "alert" : "status"}
          >
            {banner.text}
          </p>
        ) : null}
        <p className={styles.details}>{t("CATEGORY_HIERARCHY.DETAILS")}</p>
        {loading ? <p className={styles.status}>…</p> : null}
        {!loading && nodes.length === 0 ? (
          <p className={styles.empty}>{t("COMMON.NO_ITEMS")}</p>
        ) : null}
        {!loading && nodes.length > 0 ? (
          <>
            <div
              className={styles.rootDrop}
              data-over={rootOver ? "true" : "false"}
              onDragOver={(event) => {
                event.preventDefault();
                setRootOver(true);
              }}
              onDragLeave={() => setRootOver(false)}
              onDrop={(event) => {
                event.preventDefault();
                setRootOver(false);
                const childId = Number(event.dataTransfer.getData("text/plain"));
                if (Number.isFinite(childId)) {
                  void onMove(childId, -1);
                }
              }}
            >
              root
            </div>
            <TreeBranch nodes={nodes} onMove={(childId, parentId) => void onMove(childId, parentId)} />
          </>
        ) : null}
      </section>
    </div>
  );
}
