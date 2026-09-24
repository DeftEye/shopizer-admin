import styles from "./auth-card.module.css";

export function AuthCard({
  children,
  subtitle,
}: {
  children: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className={styles.limiter}>
      <div className={styles.container}>
        <div className={styles.wrap}>
          <div className={styles.form}>
            <div className={styles.title}>
              <img
                src="/shopizer-logo.svg"
                alt="Shopizer"
                width={200}
                height={66}
              />
              {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
