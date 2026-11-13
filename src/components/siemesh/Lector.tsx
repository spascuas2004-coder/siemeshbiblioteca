import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, ChevronRight, ExternalLink, Loader2, Minus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { obtenerTextoLibro } from "@/lib/siemesh/gutenberg.functions";
import { paginar } from "@/lib/siemesh/paginar";
import type { Libro } from "@/lib/siemesh/logic";

const TAMANOS = [14, 16, 18, 20, 23, 26];

export function Lector({ libro, onClose }: { libro: Libro | null; onClose: () => void }) {
  const fetchTexto = useServerFn(obtenerTextoLibro);
  const id = libro?.gutenberg_id ?? 0;
  const q = useQuery({ queryKey: ["gutenberg", id], queryFn: () => fetchTexto({ data: { id } }), enabled: !!id, staleTime: Infinity, retry: 1 });
  const [fuente, setFuente] = useState(2);
  const [pagina, setPagina] = useState(0);
  const chars = Math.round(2600 * (18 / TAMANOS[fuente]!) ** 2);
  const { paginas, capitulos } = useMemo(() => (q.data ? paginar(q.data.texto, chars) : { paginas: [], capitulos: [] }), [q.data, chars]);
  const total = paginas.length;

  useEffect(() => { setPagina(0); }, [id]);
  useEffect(() => { if (pagina >= total && total) setPagina(total - 1); }, [total, pagina]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setPagina((p) => Math.min(total - 1, p + 1));
      if (e.key === "ArrowLeft") setPagina((p) => Math.max(0, p - 1));
    };
    if (libro) window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [libro, total]);

  const capActual = [...capitulos].reverse().find((c) => c.pagina <= pagina);

  return (
    <Dialog open={!!libro} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex h-[92vh] max-w-5xl flex-col gap-0 overflow-hidden p-0 [&>button]:hidden">
        <header className="flex flex-wrap items-center gap-3 border-b bg-sidebar px-5 py-3 text-sidebar-foreground">
          <div className="min-w-0 flex-1">
            <DialogTitle className="truncate font-serif text-lg">{libro?.titulo}</DialogTitle>
            <p className="truncate text-xs opacity-70">{libro?.autor}{capActual && ` · ${capActual.titulo}`}</p>
          </div>
          {capitulos.length > 0 && (
            <Select value={String(capActual?.pagina ?? "")} onValueChange={(v) => setPagina(Number(v))}>
              <SelectTrigger className="h-8 w-52 border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground"><SelectValue placeholder="Capítulos" /></SelectTrigger>
              <SelectContent className="max-h-80">{capitulos.map((c, i) => <SelectItem key={i} value={String(c.pagina)}>{c.titulo}</SelectItem>)}</SelectContent>
            </Select>
          )}
          <div className="flex items-center gap-1 rounded-md bg-sidebar-accent p-1">
            <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-sidebar hover:text-sidebar-foreground" aria-label="Reducir letra" disabled={fuente === 0} onClick={() => setFuente((f) => f - 1)}><Minus className="h-4 w-4" /></Button>
            <span className="w-10 text-center text-xs">{TAMANOS[fuente]}px</span>
            <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-sidebar hover:text-sidebar-foreground" aria-label="Aumentar letra" disabled={fuente === TAMANOS.length - 1} onClick={() => setFuente((f) => f + 1)}><Plus className="h-4 w-4" /></Button>
          </div>
          <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" aria-label="Cerrar" onClick={onClose}><X className="h-4 w-4" /></Button>
        </header>

        <div className="flex-1 overflow-auto bg-paper">
          {!id && <p className="p-10 text-center text-muted-foreground">Este libro no tiene una edición digital libre.</p>}
          {q.isLoading && <div className="flex h-full items-center justify-center gap-2 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Descargando desde Project Gutenberg…</div>}
          {q.isError && <div className="p-10 text-center"><p className="text-destructive">No se pudo cargar el libro.</p><Button className="mt-3" variant="outline" onClick={() => q.refetch()}>Reintentar</Button></div>}
          {paginas[pagina] && (
            <article className="mx-auto max-w-2xl px-8 py-10 font-serif leading-[1.75] text-paper-foreground" style={{ fontSize: TAMANOS[fuente] }}>
              {paginas[pagina]!.parrafos.map((p, i) => {
                const esCap = capitulos.some((c) => c.pagina === pagina) && i === 0;
                return esCap ? <h3 key={i} className="mb-6 text-center text-[1.3em] font-bold">{p}</h3> : <p key={i} className="mb-4 text-justify indent-6">{p}</p>;
              })}
            </article>
          )}
        </div>

        <footer className="flex items-center gap-3 border-t bg-card px-5 py-3">
          <Button variant="outline" disabled={pagina === 0 || !total} onClick={() => setPagina((p) => p - 1)}><ChevronLeft className="h-4 w-4" />Anterior</Button>
          <div className="flex flex-1 flex-col items-center gap-1">
            <span className="text-sm">Página <b>{total ? pagina + 1 : 0}</b> de {total}</span>
            <div className="h-1 w-full max-w-sm rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: total ? `${((pagina + 1) / total) * 100}%` : 0 }} /></div>
          </div>
          <Button disabled={!total || pagina >= total - 1} onClick={() => setPagina((p) => p + 1)}>Siguiente<ChevronRight className="h-4 w-4" /></Button>
          {q.data && <a href={q.data.fuente} target="_blank" rel="noreferrer" className="hidden items-center gap-1 text-xs text-muted-foreground hover:text-foreground sm:flex">Gutenberg<ExternalLink className="h-3 w-3" /></a>}
        </footer>
      </DialogContent>
    </Dialog>
  );
}
