import styles from "./footer.module.css";

export function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className={styles.footer}>
      <span className={styles.copy}>© Shopizer 2010-{currentYear}</span>
    </footer>
  );
}
