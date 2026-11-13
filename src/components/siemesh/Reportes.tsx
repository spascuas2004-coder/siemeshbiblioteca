import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { diasMora, hoy } from "@/lib/siemesh/logic";
import { descargarCSV, imprimirPDF, type Fila } from "@/lib/siemesh/export";
import type { Siemesh } from "@/lib/siemesh/store";
import { Seccion } from "./ui";

export function Reportes({ s }: { s: Siemesh }) {
  const db = s.db!;
  const nombre = (id: number) => db.usuarios.find((u) => u.id_usuario === id);
  const titulo = (id: number) => db.libros.find((l) => l.id_libro === id)?.titulo ?? "";
  const reportes: { id: string; titulo: string; desc: string; filas: Fila[] }[] = [
    { id: "inventario", titulo: "Inventario general de libros", desc: "Stock total, disponible y prestado por título.",
      filas: db.libros.map((l) => ({ ISBN: l.isbn, Título: l.titulo, Autor: l.autor, Categoría: l.categoria, "Stock total": l.stock_total, Disponible: l.stock_disponible, Prestados: l.stock_total - l.stock_disponible, Estado: l.estado })) },
    { id: "historial", titulo: "Historial de préstamos y devoluciones", desc: "Todas las transacciones con días de mora calculados.",
      filas: db.prestamos.map((p) => ({ "#": p.id_prestamo, Usuario: nombre(p.id_usuario)?.nombre ?? "", Libro: titulo(p.id_libro), Préstamo: p.fecha_prestamo, Límite: p.fecha_limite, Devolución: p.fecha_devolucion ?? "", Estado: p.estado, "Días mora": p.estado === "Solicitado" ? 0 : diasMora(p.fecha_limite, p.fecha_devolucion ?? hoy()) })) },
    { id: "morosos", titulo: "Usuarios morosos y sanciones", desc: "Sanciones registradas y estado de cada usuario.",
      filas: db.sanciones.map((x) => ({ Usuario: nombre(x.id_usuario)?.nombre ?? "", Correo: nombre(x.id_usuario)?.correo ?? "", "Estado usuario": nombre(x.id_usuario)?.estado ?? "", Libro: titulo(db.prestamos.find((p) => p.id_prestamo === x.id_prestamo)?.id_libro ?? 0), "Días mora": x.dias_mora, Motivo: x.motivo, Sanción: x.estado })) },
  ];
  return (
    <Seccion titulo="Reportes planos" sub="Exporta a CSV (abre en Excel) o imprime / guarda como PDF.">
      <div className="space-y-6">
        {reportes.map((r, i) => (
          <div key={r.id} className="rounded-lg border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
              <div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reporte {i + 1}</p><h3 className="text-lg">{r.titulo}</h3><p className="text-sm text-muted-foreground">{r.desc}</p></div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={!r.filas.length} onClick={() => descargarCSV(`siemesh-${r.id}`, r.filas)}><Download className="h-4 w-4" />Excel / CSV</Button>
                <Button size="sm" disabled={!r.filas.length} onClick={() => imprimirPDF(r.titulo, r.filas)}><Printer className="h-4 w-4" />PDF</Button>
              </div>
            </div>
            <div className="max-h-64 overflow-auto">
              {r.filas.length === 0 ? <p className="p-4 text-sm text-muted-foreground">Sin registros todavía.</p> :
                <table className="w-full text-sm"><thead className="sticky top-0 bg-muted"><tr>{Object.keys(r.filas[0]!).map((c) => <th key={c} className="px-3 py-2 text-left font-medium">{c}</th>)}</tr></thead>
                  <tbody>{r.filas.map((f, j) => <tr key={j} className="border-t">{Object.values(f).map((v, k) => <td key={k} className="px-3 py-2">{v}</td>)}</tr>)}</tbody></table>}
            </div>
          </div>
        ))}
      </div>
    </Seccion>
  );
}
