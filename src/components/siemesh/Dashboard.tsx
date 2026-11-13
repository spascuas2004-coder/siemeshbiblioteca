import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BookCopy, Library, Repeat, UserX } from "lucide-react";
import type { Siemesh } from "@/lib/siemesh/store";
import { Seccion } from "./ui";

const colores = ["var(--chart-2)", "var(--chart-1)", "var(--chart-3)", "var(--chart-4)"];

export function Dashboard({ s }: { s: Siemesh }) {
  const db = s.db!;
  const kpis = [
    { label: "Total libros", v: db.libros.length, icon: Library },
    { label: "Copias disponibles", v: db.libros.reduce((a, l) => a + l.stock_disponible, 0), icon: BookCopy },
    { label: "Préstamos activos", v: db.prestamos.filter((p) => p.estado === "Entregado" || p.estado === "Vencido").length, icon: Repeat },
    { label: "Usuarios sancionados", v: db.usuarios.filter((u) => u.estado === "Sancionado").length, icon: UserX },
  ];
  const conteo = new Map<number, number>();
  db.prestamos.filter((p) => p.estado !== "Solicitado").forEach((p) => conteo.set(p.id_libro, (conteo.get(p.id_libro) ?? 0) + 1));
  const top = [...conteo].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, total]) => {
    const t = db.libros.find((l) => l.id_libro === id)!.titulo; return { libro: t.length > 18 ? t.slice(0, 18) + "…" : t, total };
  });
  const estados = (["Solicitado", "Entregado", "Devuelto", "Vencido"] as const).map((e) => ({ name: e, value: db.prestamos.filter((p) => p.estado === e).length }));
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-lg border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground"><span className="text-sm">{k.label}</span><k.icon className="h-4 w-4" /></div>
            <p className="mt-2 font-serif text-3xl">{k.v}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Seccion titulo="Top 5 libros más prestados" sub="Reporte gráfico 1 · barras">
          <div className="h-72 rounded-lg border bg-card p-4">
            <ResponsiveContainer><BarChart data={top}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="libro" fontSize={11} /><YAxis allowDecimals={false} fontSize={11} /><Tooltip />
              <Bar dataKey="total" name="Préstamos" fill="var(--chart-1)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
          </div>
        </Seccion>
        <Seccion titulo="Préstamos por estado" sub="Reporte gráfico 2 · torta">
          <div className="h-72 rounded-lg border bg-card p-4">
            <ResponsiveContainer><PieChart><Pie data={estados} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} label>
              {estados.map((_, i) => <Cell key={i} fill={colores[i]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer>
          </div>
        </Seccion>
      </div>
      <Seccion titulo="Registro del trigger" sub="Últimas ejecuciones de trg_actualizar_stock_prestamo">
        <div className="max-h-48 overflow-auto rounded-lg border bg-card p-4 font-mono text-xs">
          {db.log.length === 0 ? <p className="text-muted-foreground">Sin ejecuciones aún. Aprueba o devuelve un préstamo.</p> : db.log.slice(0, 30).map((m, i) => <p key={i}>› {m}</p>)}
        </div>
      </Seccion>
    </div>
  );
}
