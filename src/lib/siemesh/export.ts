export type Fila = Record<string, string | number | null>;

export function descargarCSV(nombre: string, filas: Fila[]) {
  if (!filas.length) return;
  const cols = Object.keys(filas[0]!);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = "\uFEFF" + [cols.join(";"), ...filas.map((f) => cols.map((c) => esc(f[c])).join(";"))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  a.download = `${nombre}.csv`; a.click(); URL.revokeObjectURL(a.href);
}

export function imprimirPDF(titulo: string, filas: Fila[]) {
  const cols = filas.length ? Object.keys(filas[0]!) : [];
  const w = window.open("", "_blank"); if (!w) return;
  w.document.write(`<html><head><title>${titulo}</title><style>
    body{font-family:Georgia,serif;padding:32px;color:#1b365d} h1{font-size:20px;margin:0}
    p{color:#555;font-size:12px} table{border-collapse:collapse;width:100%;font-size:12px;margin-top:16px}
    th{background:#1b365d;color:#fff;text-align:left;padding:6px} td{border-bottom:1px solid #ddd;padding:6px}
  </style></head><body><h1>SIEMESH — ${titulo}</h1><p>Politécnico Grancolombiano · Generado el ${new Date().toLocaleString("es-CO")}</p>
  <table><thead><tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>
  ${filas.map((f) => `<tr>${cols.map((c) => `<td>${f[c] ?? ""}</td>`).join("")}</tr>`).join("")}</tbody></table>
  <script>window.onload=()=>window.print()</script></body></html>`);
  w.document.close();
}
