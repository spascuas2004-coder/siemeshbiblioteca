import { useState } from "react";
import { BookOpen, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/lib/siemesh/logic";
import type { Siemesh } from "@/lib/siemesh/store";

const demo = [
  { correo: "admin@poligran.edu.co", pass: "admin123", label: "Administrador", icon: ShieldCheck },
  { correo: "user@poligran.edu.co", pass: "user123", label: "Usuario (Estudiante)", icon: User },
];

export function Login({ s }: { s: Siemesh }) {
  const [correo, setCorreo] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const entrar = () => {
    if (!s.db) return;
    try { s.signIn(login(s.db, correo, pass)); } catch (e) { setError((e as Error).message); }
  };
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="bg-hero relative hidden flex-col justify-between p-12 text-primary-foreground lg:flex">
        <div className="flex items-center gap-3"><BookOpen className="h-7 w-7 text-accent" /><span className="font-serif text-xl">SIEMESH</span></div>
        <div className="space-y-4">
          <h1 className="text-5xl leading-tight">La biblioteca,<br />en orden.</h1>
          <p className="max-w-md text-primary-foreground/75">Catálogo, préstamos, devoluciones y sanciones del Politécnico Grancolombiano en un solo lugar.</p>
        </div>
        <p className="text-xs text-primary-foreground/60">Sergio Andrés Pascuas Sierra · Ingeniería de Software · 2026</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div><h2 className="text-3xl">Iniciar sesión</h2><p className="text-sm text-muted-foreground">Usa tu correo institucional.</p></div>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); entrar(); }}>
            <div className="space-y-2"><Label htmlFor="correo">Correo</Label><Input id="correo" type="email" required value={correo} onChange={(e) => setCorreo(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="pass">Contraseña</Label><Input id="pass" type="password" required value={pass} onChange={(e) => setPass(e.target.value)} /></div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full">Entrar</Button>
          </form>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Acceso rápido <span className="font-normal normal-case tracking-normal">· completa los datos, luego pulsa Entrar</span></p>
            {demo.map((d) => (
              <Button key={d.correo} variant="outline" className="w-full justify-start" onClick={() => { setCorreo(d.correo); setPass(d.pass); setError(""); }}>
                <d.icon className="h-4 w-4" />{d.label}<span className="ml-auto text-xs text-muted-foreground">{d.correo}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
