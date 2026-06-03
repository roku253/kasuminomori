export type DataTableRow =
  | { label: string; value: string }
  | { cells: string[] };

export type ParsedTable = {
  headers?: string[];
  rows: DataTableRow[];
};

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/** Parse legacy `city-data` or `data-table` HTML into structured rows. */
export function parseTableHtml(html: string): ParsedTable {
  const trimmed = html.trim();
  if (!trimmed) return { rows: [] };

  const headers: string[] = [];
  const thead = trimmed.match(/<thead[^>]*>([\s\S]*?)<\/thead>/i);
  if (thead) {
    const thRe = /<th[^>]*>([\s\S]*?)<\/th>/gi;
    let m;
    while ((m = thRe.exec(thead[1])) !== null) {
      const text = stripTags(m[1]);
      if (text) headers.push(text);
    }
  }

  const rows: DataTableRow[] = [];
  const tbodyMatch = trimmed.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
  const rowSource = tbodyMatch ? tbodyMatch[1] : trimmed;
  const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let tr;
  while ((tr = trRe.exec(rowSource)) !== null) {
    const rowHtml = tr[1];
    const th = rowHtml.match(/<th[^>]*>([\s\S]*?)<\/th>/i);
    const td = rowHtml.match(/<td[^>]*>([\s\S]*?)<\/td>/i);
    if (th && td) {
      rows.push({ label: stripTags(th[1]), value: stripTags(td[1]) });
      continue;
    }
    const cells: string[] = [];
    const cellRe = /<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi;
    let cell;
    while ((cell = cellRe.exec(rowHtml)) !== null) {
      const text = stripTags(cell[1]);
      if (text) cells.push(text);
    }
    if (cells.length) rows.push({ cells });
  }

  return { headers: headers.length ? headers : undefined, rows };
}

type Props = {
  rows?: DataTableRow[];
  headers?: string[];
  tableHtml?: string;
  className?: string;
  caption?: string;
};

function isLabelValue(row: DataTableRow): row is { label: string; value: string } {
  return "label" in row && "value" in row;
}

export function DataTable({ rows, headers, tableHtml, className = "", caption }: Props) {
  let parsedHeaders = headers;
  let parsedRows = rows ?? [];

  if (tableHtml) {
    const parsed = parseTableHtml(tableHtml);
    parsedHeaders = parsedHeaders ?? parsed.headers;
    parsedRows = parsed.rows;
  }

  if (!parsedRows.length) return null;

  const useKeyValue = parsedRows.every(isLabelValue);
  const tableClass = useKeyValue
    ? "city-data w-full border-collapse text-sm"
    : "data-table w-full border-collapse text-sm";

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className={tableClass}>
        {caption && <caption className="sr-only">{caption}</caption>}
        {parsedHeaders && parsedHeaders.length > 0 && (
          <thead>
            <tr>
              {parsedHeaders.map((h) => (
                <th
                  key={h}
                  className="border border-[#ccc] bg-[#e8f0fa] px-3 py-2 text-left font-bold text-[var(--kasumi-blue)]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {parsedRows.map((row, i) =>
            isLabelValue(row) ? (
              <tr key={`${row.label}-${i}`}>
                <th className="w-[28%] border border-[#ccc] bg-[#e8f0e8] px-3 py-2 text-left font-normal">
                  {row.label}
                </th>
                <td className="border border-[#ccc] px-3 py-2">{row.value}</td>
              </tr>
            ) : (
              <tr key={i}>
                {row.cells.map((cell, j) => (
                  <td key={j} className="border border-[#ccc] px-3 py-2">
                    {cell}
                  </td>
                ))}
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}
