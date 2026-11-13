import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { guardarLibro, guardarUsuario, levantarSancion, toggleLibro, toggleUsuario, type Libro, type NuevoUsuario } from "@/lib/siemesh/logic";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Siemesh } from "@/lib/siemesh/store";
import { Estado, Seccion } from "./ui";

type FormLibro = { id_libro?: number; isbn: string; titulo: string; autor: string; categoria: string; stock_total: string };
const vacio: FormLibro = { isbn: "", titulo: "", autor: "", categoria: "", stock_total: "1" };

export function GestionLibros({ s }: { s: Siemesh }) {
  const db = s.db!;
  const [f, setF] = useState<FormLibro | null>(null);
  const editar = (l: Libro) => setF({ ...l, stock_total: String(l.stock_total) });
  const guardar = () => f && s.run((d) => guardarLibro(d, { ...f, stock_total: Number(f.stock_total) }), f.id_libro ? "Libro actualizado" : "Libro registrado") && setF(null);
  return (
    <Seccion titulo="Gestión de libros" acciones={<Button onClick={() => setF(vacio)}><Plus className="h-4 w-4" />Nuevo libro</Button>}>
      <div className="rounded-lg border bg-card">
        <Table><TableHeader><TableRow><TableHead>ISBN</TableHead><TableHead>Título</TableHead><TableHead>Autor</TableHead><TableHead>Categoría</TableHead><TableHead>Stock</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
          <TableBody>{db.libros.map((l) => (
            <TableRow key={l.id_libro}><TableCell className="font-mono text-xs">{l.isbn}</TableCell><TableCell className="font-medium">{l.titulo}</TableCell><TableCell>{l.autor}</TableCell><TableCell>{l.categoria}</TableCell>
              <TableCell>{l.stock_disponible}/{l.stock_total}</TableCell><TableCell><Estado v={l.estado} /></TableCell>
              <TableCell className="space-x-2 text-right"><Button size="sm" variant="ghost" onClick={() => editar(l)}><Pencil className="h-4 w-4" /></Button>
                <Button size="sm" variant="outline" onClick={() => s.run((d) => toggleLibro(d, l.id_libro))}>{l.estado === "Activo" ? "Inactivar" : "Activar"}</Button></TableCell></TableRow>))}
          </TableBody></Table>
      </div>
      <Dialog open={!!f} onOpenChange={(o) => !o && setF(null)}>
        <DialogContent><DialogHeader><DialogTitle>{f?.id_libro ? "Editar libro" : "Nuevo libro"}</DialogTitle></DialogHeader>
          {f && <div className="grid gap-3">
            {(["isbn", "titulo", "autor", "categoria"] as const).map((k) => (
              <div key={k} className="space-y-1"><Label htmlFor={k} className="capitalize">{k === "titulo" ? "Título" : k === "categoria" ? "Categoría" : k.toUpperCase() === "ISBN" ? "ISBN" : "Autor"}</Label>
                <Input id={k} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></div>))}
            <div className="space-y-1"><Label htmlFor="st">Stock total</Label><Input id="st" type="number" min={0} value={f.stock_total} onChange={(e) => setF({ ...f, stock_total: e.target.value })} /></div>
          </div>}
          <DialogFooter><Button variant="outline" onClick={() => setF(null)}>Cancelar</Button><Button onClick={guardar}>Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Seccion>
  );
}

export function GestionUsuarios({ s }: { s: Siemesh }) {
  const db = s.db!;
  const [f, setF] = useState<NuevoUsuario | null>(null);
  return (
    <Seccion titulo="Gestión de Usuarios" sub="Los usuarios registrados pueden iniciar sesión de inmediato." acciones={<Button onClick={() => setF({ nombre: "", correo: "", password: "", rol: "Usuario", estado: "Activo" })}><Plus className="h-4 w-4" />Registrar Nuevo Usuario</Button>}>
      <div className="rounded-lg border bg-card">
        <Table><TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Correo</TableHead><TableHead>Rol</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
          <TableBody>{db.usuarios.map((u) => (
            <TableRow key={u.id_usuario}><TableCell className="font-medium">{u.nombre}</TableCell><TableCell>{u.correo}</TableCell><TableCell>{u.rol}</TableCell><TableCell><Estado v={u.estado} /></TableCell>
              <TableCell className="space-x-2 text-right">
                {u.estado === "Sancionado" && <Button size="sm" onClick={() => s.run((d) => levantarSancion(d, u.id_usuario), "Sanción levantada")}>Levantar sanción</Button>}
                {u.id_usuario !== s.user?.id_usuario && u.id_usuario !== 1 && <Button size="sm" variant="outline" onClick={() => s.run((d) => toggleUsuario(d, u.id_usuario))}>{u.estado === "Inactivo" ? "Activar" : "Inactivar"}</Button>}
              </TableCell></TableRow>))}
          </TableBody></Table>
      </div>
      <Dialog open={!!f} onOpenChange={(o) => !o && setF(null)}>
        <DialogContent><DialogHeader><DialogTitle>Registrar nuevo usuario</DialogTitle></DialogHeader>
          {f && <div className="grid gap-3">
            <div className="space-y-1"><Label htmlFor="un">Nombre</Label><Input id="un" value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} /></div>
            <div className="space-y-1"><Label htmlFor="uc">Correo</Label><Input id="uc" type="email" value={f.correo} onChange={(e) => setF({ ...f, correo: e.target.value })} /></div>
            <div className="space-y-1"><Label htmlFor="up">Contraseña</Label><Input id="up" type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Rol</Label><Select value={f.rol} onValueChange={(v) => setF({ ...f, rol: v as NuevoUsuario["rol"] })}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Usuario">Usuario (Estudiante)</SelectItem><SelectItem value="Administrador">Administrador</SelectItem></SelectContent></Select></div>
              <div className="space-y-1"><Label>Estado</Label><Select value={f.estado} onValueChange={(v) => setF({ ...f, estado: v as NuevoUsuario["estado"] })}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Activo">Activo</SelectItem><SelectItem value="Inactivo">Inactivo</SelectItem></SelectContent></Select></div>
            </div>
          </div>}
          <DialogFooter><Button variant="outline" onClick={() => setF(null)}>Cancelar</Button>
            <Button onClick={() => f && s.run((d) => guardarUsuario(d, f), `Usuario creado: ${f.correo} ya puede iniciar sesión`) && setF(null)}>Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Seccion>
  );
}
