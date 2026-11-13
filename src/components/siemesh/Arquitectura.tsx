import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import sql from "../../../database/siemesh.sql?raw";
import { Seccion } from "./ui";

export function Arquitectura() {
  const bajar = () => {
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([sql], { type: "text/plain" }));
    a.download = "siemesh.sql"; a.click();
  };
  return (
    <Seccion titulo="Arquitectura BD (SQL)" sub="5 tablas · procedimientos almacenados · trigger trg_actualizar_stock_prestamo · vistas de reportes (PostgreSQL)"
      acciones={<Button variant="outline" onClick={bajar}><Download className="h-4 w-4" />Descargar .sql</Button>}>
      <pre className="max-h-[70vh] overflow-auto rounded-lg bg-sidebar p-5 font-mono text-xs leading-relaxed text-sidebar-foreground">{sql}</pre>
    </Seccion>
  );
}
