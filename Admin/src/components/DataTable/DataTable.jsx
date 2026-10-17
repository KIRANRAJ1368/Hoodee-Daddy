import LoadingState from "../LoadingState/LoadingState";
import EmptyState from "../EmptyState/EmptyState";
import "./DataTable.css";

/**
 * columns: [{ key, label, render?(row), width?, align? }]
 * rows: array of data objects
 * rowKey: (row) => string|number
 */
export default function DataTable({
  columns,
  rows,
  data,
  rowKey,
  isLoading,
  loading,
  emptyTitle = "Nothing here yet",
  emptyMessage,
  emptyDescription,
  emptyAction
}) {
  const tableRows = rows || data || [];
  const isTableLoading = isLoading ?? loading ?? false;
  const getKey = typeof rowKey === "function" ? rowKey : (row, idx) => row?.id ?? row?._id ?? row?.key ?? idx;
  const title = emptyMessage || emptyTitle;

  if (isTableLoading) {
    return (
      <div className="data-table-wrap" aria-busy="true">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col, idx) => {
                const label = col.label ?? col.header ?? "";
                const key = col.key ?? col.id ?? label ?? idx;
                return (
                  <th
                    key={key}
                    style={{
                      ...(col.width ? { width: col.width, minWidth: col.width } : {}),
                      ...(col.align ? { textAlign: col.align } : {})
                    }}
                  >
                    {label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }).map((_, rIdx) => (
              <tr key={rIdx}>
                {columns.map((col, cIdx) => (
                  <td key={cIdx}>
                    <div
                      className={`data-table-skeleton-cell sk ${
                        cIdx % 3 === 0
                          ? "data-table-skeleton-cell--short w2"
                          : cIdx % 3 === 1
                          ? "data-table-skeleton-cell--medium w1"
                          : "data-table-skeleton-cell--long w3"
                      }`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!tableRows || tableRows.length === 0) {
    return <EmptyState title={title} description={emptyDescription} action={emptyAction} />;
  }

  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col, idx) => {
              const label = col.label ?? col.header ?? "";
              const key = col.key ?? col.id ?? label ?? idx;
              return (
                <th
                  key={key}
                  style={{
                    ...(col.width ? { width: col.width, minWidth: col.width } : {}),
                    ...(col.align ? { textAlign: col.align } : {})
                  }}
                >
                  {label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {tableRows.map((row, idx) => (
            <tr
              key={getKey(row, idx)}
              className="fade"
              style={{ animationDelay: `${Math.min(idx * 35, 350)}ms` }}
            >
              {columns.map((col, colIdx) => {
                const key = col.key ?? col.id ?? col.label ?? col.header ?? colIdx;
                const cellContent = col.render
                  ? col.render(row, idx)
                  : col.cell
                  ? col.cell(row, idx)
                  : col.key
                  ? row[col.key]
                  : null;

                return (
                  <td
                    key={key}
                    style={{
                      ...(col.width ? { width: col.width, minWidth: col.width } : {}),
                      ...(col.align ? { textAlign: col.align } : {})
                    }}
                  >
                    {cellContent}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
