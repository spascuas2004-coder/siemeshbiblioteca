import { useMemo, useState } from "react";
import { BookOpenText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { solicitarPrestamo, type Libro } from "@/lib/siemesh/logic";
import { Lector } from "./Lector";
import type { Siemesh } from "@/lib/siemesh/store";
import { Seccion } from "./ui";

export function Catalogo({ s }: { s: Siemesh }) {
  const db = s.db!; const user = s.user!;
  const [leyendo, setLeyendo] = useState<Libro | null>(null);
  const [q, setQ] = useState(""); const [cat, setCat] = useState("Todas");
  const cats = useMemo(() => ["Todas", ...new Set(db.libros.map((l) => l.categoria))], [db.libros]);
  const libros = db.libros.filter((l) => (user.rol === "Administrador" || l.estado === "Activo")
    && (cat === "Todas" || l.categoria === cat)
    && `${l.titulo} ${l.autor}`.toLowerCase().includes(q.toLowerCase()));
  const sancionado = user.estado === "Sancionado";
  return (
    <Seccion titulo="Catálogo" sub={`${libros.length} títulos`}>
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-60 flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por título o autor" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <Select value={cat} onValueChange={setCat}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>{cats.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {libros.map((l) => {
          const pct = l.stock_total ? (l.stock_disponible / l.stock_total) * 100 : 0;
          return (
            <article key={l.id_libro} className="flex flex-col rounded-lg border bg-card p-5 shadow-sm transition hover:shadow-md">
              <span className="text-xs font-semibold uppercase tracking-wider text-accent-foreground/70">{l.categoria}</span>
              <h3 className="mt-1 text-lg leading-snug">{l.titulo}</h3>
              <p className="text-sm text-muted-foreground">{l.autor}</p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">ISBN {l.isbn}</p>
              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-sm"><span>Disponibles</span><span className="font-semibold">{l.stock_disponible} / {l.stock_total}</span></div>
                <div className="h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} /></div>
              </div>
              <div className="mt-auto flex flex-col gap-2 pt-4">
              <Button variant="secondary" disabled={!l.gutenberg_id} onClick={() => setLeyendo(l)}>
                <BookOpenText className="h-4 w-4" />{l.gutenberg_id ? "Leer Libro" : "Sin edición digital"}
              </Button>
              {user.rol === "Usuario" && (
                <Button disabled={l.stock_disponible === 0}
                  variant={sancionado ? "outline" : "default"}
                  onClick={() => s.run((d) => solicitarPrestamo(d, user.id_usuario, l.id_libro), "Préstamo solicitado. Espera la aprobación del administrador.")}>
                  {l.stock_disponible === 0 ? "Sin copias" : "Solicitar préstamo"}
                </Button>
              )}
              </div>
              {l.estado === "Inactivo" && <p className="mt-3 text-xs text-destructive">Inactivo</p>}
            </article>
          );
        })}
      </div>
      <Lector libro={leyendo} onClose={() => setLeyendo(null)} />
    </Seccion>
  );
}
