export function sortNewestFirst(rows = []) {
  return [...rows].sort((a, b) => {
    const getTime = (row) => {
      const value = row?.createdAt ?? row?.created_at ?? row?.createdOn ?? row?.created_on;
      const time = value ? new Date(value).getTime() : NaN;
      return Number.isFinite(time) ? time : null;
    };
    const timeA = getTime(a);
    const timeB = getTime(b);
    if (timeA !== null && timeB !== null && timeA !== timeB) return timeB - timeA;
    if (timeA !== null && timeB === null) return -1;
    if (timeA === null && timeB !== null) return 1;
    const idA = Number(a?.id);
    const idB = Number(b?.id);
    return Number.isFinite(idA) && Number.isFinite(idB) ? idB - idA : 0;
  });
}
