import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { actualizarVencidos, seed, type DB, type Usuario } from "./logic";

const KEY = "siemesh-db-v2";
const SESSION = "siemesh-session-v2";

export function useSiemesh() {
  const [db, setDb] = useState<DB | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    let data: DB;
    try { data = JSON.parse(localStorage.getItem(KEY) ?? "") as DB; } catch { data = seed(); }
    if (!data?.libros) data = seed();
    setDb(actualizarVencidos(data));
    const s = Number(localStorage.getItem(SESSION)); if (s) setUserId(s);
  }, []);
  useEffect(() => { if (db) localStorage.setItem(KEY, JSON.stringify(db)); }, [db]);

  /** Ejecuta una operación tipo procedimiento almacenado con TRY/CATCH. */
  const run = useCallback((fn: (d: DB) => DB, ok?: string) => {
    if (!db) return false;
    try {
      const next = fn(db);
      const nuevos = next.log.length - db.log.length;
      next.log.slice(0, Math.max(0, nuevos)).forEach((m) => toast.info(m));
      setDb(next); if (ok) toast.success(ok); return true;
    } catch (e) { toast.error((e as Error).message); return false; }
  }, [db]);

  const user: Usuario | null = db?.usuarios.find((u) => u.id_usuario === userId) ?? null;
  return {
    db, user, run,
    signIn: (u: Usuario) => { setUserId(u.id_usuario); localStorage.setItem(SESSION, String(u.id_usuario)); },
    signOut: () => { setUserId(null); localStorage.removeItem(SESSION); },
    reset: () => { setDb(seed()); toast.success("Datos de demostración restablecidos"); },
  };
}
export type Siemesh = ReturnType<typeof useSiemesh>;
