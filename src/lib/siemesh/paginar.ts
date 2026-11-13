export interface Pagina { parrafos: string[]; capitulo?: string }
const RE_CAP = /^(cap[ií]tulo|chapter|parte|part|libro|book|canto)\b|^[IVXLC]+\.?$/i;

/** Divide el texto en páginas por párrafos y detecta encabezados de capítulo. */
export function paginar(texto: string, charsPorPagina: number): { paginas: Pagina[]; capitulos: { titulo: string; pagina: number }[] } {
  const parrafos = texto.split(/\n\s*\n/).map((p) => p.replace(/\s*\n\s*/g, " ").trim()).filter(Boolean);
  const paginas: Pagina[] = []; const capitulos: { titulo: string; pagina: number }[] = [];
  let actual: string[] = []; let len = 0;
  const cerrar = () => { if (actual.length) { paginas.push({ parrafos: actual }); actual = []; len = 0; } };
  for (const p of parrafos) {
    if (p.length < 90 && RE_CAP.test(p)) {
      cerrar();
      capitulos.push({ titulo: p.length > 70 ? p.slice(0, 70) + "…" : p, pagina: paginas.length });
    }
    if (len + p.length > charsPorPagina && actual.length) cerrar();
    actual.push(p); len += p.length;
  }
  cerrar();
  return { paginas, capitulos };
}
