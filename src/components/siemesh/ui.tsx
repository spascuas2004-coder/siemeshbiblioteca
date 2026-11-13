import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const tonos: Record<string, string> = {
  Activo: "bg-success/15 text-success border-success/30",
  Activa: "bg-destructive/10 text-destructive border-destructive/30",
  Cumplida: "bg-muted text-muted-foreground",
  Sancionado: "bg-destructive/10 text-destructive border-destructive/30",
  Inactivo: "bg-muted text-muted-foreground",
  Solicitado: "bg-warning/20 text-accent-foreground border-warning/40",
  Entregado: "bg-primary/10 text-primary border-primary/30",
  Devuelto: "bg-success/15 text-success border-success/30",
  Vencido: "bg-destructive/10 text-destructive border-destructive/30",
};
export function Estado({ v }: { v: string }) {
  return <Badge variant="outline" className={cn("font-medium", tonos[v])}>{v}</Badge>;
}

export function Seccion({ titulo, sub, children, acciones }: { titulo: string; sub?: string; children: ReactNode; acciones?: ReactNode }) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="text-2xl text-foreground">{titulo}</h2>{sub && <p className="text-sm text-muted-foreground">{sub}</p>}</div>
        {acciones}
      </div>
      {children}
    </section>
  );
}
