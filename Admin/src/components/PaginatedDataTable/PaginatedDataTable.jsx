import { useEffect, useMemo, useState } from "react";
import DataTable from "../DataTable/DataTable";
import Pagination from "../Pagination/Pagination";
import { sortNewestFirst as sortRecordsNewestFirst } from "../../utils/sortNewestFirst";

const PAGE_SIZE = 10;

export default function PaginatedDataTable({ rows = [], sortNewestFirst = false, ...tableProps }) {
  const [page, setPage] = useState(1);
  const orderedRows = useMemo(() => sortNewestFirst ? sortRecordsNewestFirst(rows) : rows, [rows, sortNewestFirst]);
  const totalPages = Math.max(1, Math.ceil(orderedRows.length / PAGE_SIZE));
  const visibleRows = useMemo(() => orderedRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [orderedRows, page]);

  useEffect(() => {
    setPage(1);
  }, [rows]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <>
      <DataTable {...tableProps} rows={visibleRows} />
      <Pagination page={page} totalPages={totalPages} total={orderedRows.length} onChange={setPage} />
    </>
  );
}
