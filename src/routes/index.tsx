import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, BookOpen, Database, FileText, Library, LogOut, Repeat, RotateCcw, Users, BookMarked } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSiemesh } from "@/lib/siemesh/store";
import { Login } from "@/components/siemesh/Login";
import { Catalogo } from "@/components/siemesh/Catalogo";
import { MisPrestamos } from "@/components/siemesh/MisPrestamos";
import { Dashboard } from "@/components/siemesh/Dashboard";
import { Prestamos } from "@/components/siemesh/Prestamos";
import { GestionLibros, GestionUsuarios } from "@/components/siemesh/Gestion";
import { Reportes } from "@/components/siemesh/Reportes";
import { Arquitectura } from "@/components/siemesh/Arquitectura";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SIEMESH MVP — Sistema de Gestión Bibliotecaria" },
      { name: "description", content: "Catálogo, préstamos, devoluciones, sanciones y reportes de la biblioteca del Politécnico Grancolombiano." },
      { property: "og:title", content: "SIEMESH MVP — Sistema de Gestión Bibliotecaria" },
      { property: "og:description", content: "Catálogo, préstamos, devoluciones, sanciones y reportes de la biblioteca del Politécnico Grancolombiano." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const vistasAdmin = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "prestamos", label: "Préstamos", icon: Repeat },
  { id: "libros", label: "Libros", icon: Library },
  { id: "usuarios", label: "Usuarios", icon: Users },
  { id: "catalogo", label: "Catálogo", icon: BookOpen },
  { id: "reportes", label: "Reportes", icon: FileText },
  { id: "sql", label: "Arquitectura BD", icon: Database },
];
const vistasUsuario = [
  { id: "catalogo", label: "Catálogo", icon: BookOpen },
  { id: "mis", label: "Mis préstamos y sanciones", icon: BookMarked },
];

function Index() {
  const s = useSiemesh();
  const [vista, setVista] = useState("");
  useEffect(() => { if (s.user) setVista(s.user.rol === "Administrador" ? "dashboard" : "catalogo"); }, [s.user?.id_usuario]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!s.db) return <div className="min-h-screen bg-background" />;
  if (!s.user) return <Login s={s} />;
  const vistas = s.user.rol === "Administrador" ? vistasAdmin : vistasUsuario;

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col bg-sidebar text-sidebar-foreground md:sticky md:top-0 md:h-screen md:w-64">
        <div className="flex items-center gap-2 p-5"><BookOpen className="h-6 w-6 text-sidebar-primary" /><span className="font-serif text-lg">SIEMESH</span></div>
        <nav className="flex gap-1 overflow-x-auto px-3 md:flex-1 md:flex-col">
          {vistas.map((v) => (
            <button key={v.id} onClick={() => setVista(v.id)}
              className={cn("flex items-center gap-3 whitespace-nowrap rounded-md px-3 py-2 text-left text-sm transition",
                vista === v.id ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/60")}>
              <v.icon className={cn("h-4 w-4", vista === v.id && "text-sidebar-primary")} />{v.label}
            </button>
          ))}
        </nav>
        <div className="space-y-2 border-t border-sidebar-border p-4 text-sm">
          <p className="font-medium">{s.user.nombre}</p>
          <p className="text-xs opacity-70">{s.user.rol} · {s.user.estado}</p>
          <div className="flex gap-2 pt-1">
            <Button size="sm" variant="secondary" onClick={s.signOut}><LogOut className="h-4 w-4" />Salir</Button>
            {s.user.rol === "Administrador" && <Button size="sm" variant="ghost" className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" onClick={s.reset} title="Restablecer datos de demostración"><RotateCcw className="h-4 w-4" /></Button>}
          </div>
        </div>
      </aside>
      <main className="flex-1 bg-background p-6 md:p-10">
        <div className="mx-auto max-w-6xl">
          {vista === "dashboard" && <Dashboard s={s} />}
          {vista === "prestamos" && <Prestamos s={s} />}
          {vista === "libros" && <GestionLibros s={s} />}
          {vista === "usuarios" && <GestionUsuarios s={s} />}
          {vista === "catalogo" && <Catalogo s={s} />}
          {vista === "mis" && <MisPrestamos s={s} />}
          {vista === "reportes" && <Reportes s={s} />}
          {vista === "sql" && <Arquitectura />}
        </div>
      </main>
    </div>
  );
}
