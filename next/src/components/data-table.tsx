import styles from "./data-table.module.css";

export type DataColumn<T> = {
  key: string;
  title: string;
  filter?: boolean;
  render?: (row: T) => React.ReactNode;
};

export function DataTable<T extends object>({
  columns,
  rows,
  loading,
  filters,
  onFilter,
  actions,
}: {
  columns: DataColumn<T>[];
  rows: T[];
  loading?: boolean;
  filters?: Record<string, string>;
  onFilter?: (field: string, value: string) => void;
  actions?: (row: T) => React.ReactNode;
}) {
  return (
    <div className={styles.wrap} data-loading={loading ? "true" : "false"}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>
                <div>{column.title}</div>
                {column.filter && onFilter ? (
                  <input
                    className={styles.filter}
                    value={filters?.[column.key] ?? ""}
                    onChange={(event) => onFilter(column.key, event.target.value)}
                    aria-label={`Filter ${column.title}`}
                  />
                ) : null}
              </th>
            ))}
            {actions ? <th></th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={(row as { id?: string | number }).id ?? index}>
              {columns.map((column) => (
                <td key={column.key}>
                  {column.render
                    ? column.render(row)
                    : String((row as Record<string, unknown>)[column.key] ?? "")}
                </td>
              ))}
              {actions ? <td className={styles.actions}>{actions(row)}</td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
