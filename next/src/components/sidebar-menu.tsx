"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

import { buildVisibleMenu, type MenuNode } from "@/lib/auth/menu";
import { getRoles } from "@/lib/auth/session";
import { readEnv } from "@/lib/env";

import { useI18n } from "./i18n-provider";
import styles from "./sidebar-menu.module.css";

export function SidebarMenu() {
  const { t } = useI18n();
  const pathname = usePathname();
  const items = useMemo(
    () => buildVisibleMenu(getRoles(), readEnv().mode),
    [],
  );

  return (
    <nav className={styles.nav} aria-label="Admin">
      <MenuList items={items} t={t} pathname={pathname} />
    </nav>
  );
}

function MenuList({
  items,
  t,
  pathname,
}: {
  items: MenuNode[];
  t: (key: string) => string;
  pathname: string | null;
}) {
  return (
    <ul className={styles.list}>
      {items.map((item) => (
        <MenuEntry key={item.key} item={item} t={t} pathname={pathname} />
      ))}
    </ul>
  );
}

function MenuEntry({
  item,
  t,
  pathname,
}: {
  item: MenuNode;
  t: (key: string) => string;
  pathname: string | null;
}) {
  const hasChildren = !!item.children?.length;
  const childActive = hasChildren && isActiveBranch(item, pathname);
  const [open, setOpen] = useState(!!item.home || childActive);
  const active = item.link ? pathname === item.link : childActive;

  if (hasChildren) {
    return (
      <li>
        <button
          type="button"
          className={`${styles.item} ${active ? styles.active : ""}`}
          onClick={() => setOpen((v) => !v)}
        >
          <span>{t(item.key)}</span>
          <span className={styles.chevron}>{open ? "▾" : "▸"}</span>
        </button>
        {open ? (
          <div className={styles.children}>
            <MenuList items={item.children ?? []} t={t} pathname={pathname} />
          </div>
        ) : null}
      </li>
    );
  }

  if (!item.link) {
    return null;
  }

  return (
    <li>
      <Link
        href={item.link}
        className={`${styles.item} ${active ? styles.active : ""}`}
      >
        {t(item.key)}
      </Link>
    </li>
  );
}

function isActiveBranch(item: MenuNode, pathname: string | null): boolean {
  if (item.link && pathname === item.link) {
    return true;
  }
  return !!item.children?.some((child) => isActiveBranch(child, pathname));
}
