import { AlertTriangle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { diasMora, hoy } from "@/lib/siemesh/logic";
import type { Siemesh } from "@/lib/siemesh/store";
import { Estado, Seccion } from "./ui";

export function MisPrestamos({ s }: { s: Siemesh }) {
  const db = s.db!; const user = s.user!;
  const mios = db.prestamos.filter((p) => p.id_usuario === user.id_usuario).sort((a, b) => b.id_prestamo - a.id_prestamo);
  const sanciones = db.sanciones.filter((x) => x.id_usuario === user.id_usuario);
  const titulo = (id: number) => db.libros.find((l) => l.id_libro === id)?.titulo;
  return (
    <div className="space-y-8">
      {user.estado === "Sancionado" && (
        <div className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div><p className="font-semibold">Tu cuenta está sancionada</p><p className="text-sm">No puedes solicitar préstamos hasta que el administrador levante la sanción.</p></div>
        </div>
      )}
      <Seccion titulo="Mis préstamos">
        <div className="rounded-lg border bg-card">
          <Table><TableHeader><TableRow><TableHead>Libro</TableHead><TableHead>Préstamo</TableHead><TableHead>Fecha límite</TableHead><TableHead>Devolución</TableHead><TableHead>Mora</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
            <TableBody>{mios.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Aún no tienes préstamos.</TableCell></TableRow>}
              {mios.map((p) => <TableRow key={p.id_prestamo}><TableCell className="font-medium">{titulo(p.id_libro)}</TableCell><TableCell>{p.fecha_prestamo}</TableCell><TableCell>{p.fecha_limite}</TableCell><TableCell>{p.fecha_devolucion ?? "—"}</TableCell>
                <TableCell>{p.estado === "Solicitado" ? "—" : `${diasMora(p.fecha_limite, p.fecha_devolucion ?? hoy())} d`}</TableCell><TableCell><Estado v={p.estado} /></TableCell></TableRow>)}
            </TableBody></Table>
        </div>
      </Seccion>
      <Seccion titulo="Mis sanciones">
        <div className="rounded-lg border bg-card">
          <Table><TableHeader><TableRow><TableHead>Motivo</TableHead><TableHead>Días de mora</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
            <TableBody>{sanciones.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Sin sanciones.</TableCell></TableRow>}
              {sanciones.map((x) => <TableRow key={x.id_sancion}><TableCell>{x.motivo}</TableCell><TableCell>{x.dias_mora}</TableCell><TableCell><Estado v={x.estado} /></TableCell></TableRow>)}
            </TableBody></Table>
        </div>
      </Seccion>
    </div>
  );
}
