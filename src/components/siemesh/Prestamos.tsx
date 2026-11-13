import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { aprobarPrestamo, diasMora, hoy, registrarDevolucion, type Prestamo } from "@/lib/siemesh/logic";
import type { Siemesh } from "@/lib/siemesh/store";
import { Estado, Seccion } from "./ui";

export function Prestamos({ s }: { s: Siemesh }) {
  const db = s.db!;
  const [dev, setDev] = useState<Prestamo | null>(null);
  const [fecha, setFecha] = useState(hoy());
  const nombre = (id: number) => db.usuarios.find((u) => u.id_usuario === id)?.nombre;
  const titulo = (id: number) => db.libros.find((l) => l.id_libro === id)?.titulo;
  const orden = { Solicitado: 0, Vencido: 1, Entregado: 2, Devuelto: 3 };
  const lista = [...db.prestamos].sort((a, b) => orden[a.estado] - orden[b.estado] || b.id_prestamo - a.id_prestamo);
  return (
    <Seccion titulo="Préstamos y devoluciones" sub="Aprueba solicitudes y registra devoluciones (elige la fecha para simular mora).">
      <div className="rounded-lg border bg-card">
        <Table><TableHeader><TableRow><TableHead>#</TableHead><TableHead>Usuario</TableHead><TableHead>Libro</TableHead><TableHead>Préstamo</TableHead><TableHead>Límite</TableHead><TableHead>Devolución</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Acción</TableHead></TableRow></TableHeader>
          <TableBody>{lista.map((p) => (
            <TableRow key={p.id_prestamo}>
              <TableCell className="font-mono text-xs">{p.id_prestamo}</TableCell><TableCell>{nombre(p.id_usuario)}</TableCell><TableCell className="font-medium">{titulo(p.id_libro)}</TableCell>
              <TableCell>{p.fecha_prestamo}</TableCell><TableCell>{p.fecha_limite}</TableCell><TableCell>{p.fecha_devolucion ?? "—"}</TableCell><TableCell><Estado v={p.estado} /></TableCell>
              <TableCell className="text-right">
                {p.estado === "Solicitado" && <Button size="sm" onClick={() => s.run((d) => aprobarPrestamo(d, p.id_prestamo), "Préstamo aprobado y entregado")}>Aprobar y entregar</Button>}
                {(p.estado === "Entregado" || p.estado === "Vencido") && <Button size="sm" variant="outline" onClick={() => { setDev(p); setFecha(hoy()); }}>Registrar devolución</Button>}
              </TableCell>
            </TableRow>))}
          </TableBody></Table>
      </div>
      <Dialog open={!!dev} onOpenChange={(o) => !o && setDev(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar devolución</DialogTitle></DialogHeader>
          {dev && <div className="space-y-3 text-sm">
            <p><b>{titulo(dev.id_libro)}</b> — {nombre(dev.id_usuario)}</p>
            <p>Fecha límite: <b>{dev.fecha_limite}</b></p>
            <div className="space-y-2"><Label htmlFor="fd">Fecha real de devolución</Label><Input id="fd" type="date" value={fecha} min={dev.fecha_prestamo} onChange={(e) => setFecha(e.target.value)} /></div>
            <p className={diasMora(dev.fecha_limite, fecha) > 0 ? "font-semibold text-destructive" : "text-success"}>
              Días de mora (calculado): {diasMora(dev.fecha_limite, fecha)}{diasMora(dev.fecha_limite, fecha) > 0 && " → se creará una sanción"}</p>
          </div>}
          <DialogFooter><Button variant="outline" onClick={() => setDev(null)}>Cancelar</Button>
            <Button onClick={() => { if (dev && s.run((d) => registrarDevolucion(d, dev.id_prestamo, fecha), "Devolución registrada")) setDev(null); }}>Confirmar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Seccion>
  );
}
