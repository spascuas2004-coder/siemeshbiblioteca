import { createServerFn } from "@tanstack/react-start";

const MAX_CHARS = 700_000;

/** Descarga el texto completo de una obra de dominio público desde Project Gutenberg. */
export const obtenerTextoLibro = createServerFn({ method: "GET" })
  .inputValidator((input: { id: number }) => {
    const id = Number(input?.id);
    if (!Number.isInteger(id) || id <= 0 || id > 10_000_000) throw new Error("Identificador de libro inválido.");
    return { id };
  })
  .handler(async ({ data }) => {
    const url = `https://www.gutenberg.org/cache/epub/${data.id}/pg${data.id}.txt`;
    const res = await fetch(url, { headers: { "User-Agent": "SIEMESH-MVP/1.0" } });
    if (!res.ok) throw new Error("No se pudo descargar el libro desde Project Gutenberg.");
    let text = await res.text();
    const start = text.search(/\*\*\* ?START OF (THE|THIS) PROJECT GUTENBERG[^\n]*\n/i);
    if (start >= 0) text = text.slice(text.indexOf("\n", start) + 1);
    const end = text.search(/\*\*\* ?END OF (THE|THIS) PROJECT GUTENBERG/i);
    if (end >= 0) text = text.slice(0, end);
    text = text.replace(/\r\n/g, "\n").trim();
    const truncado = text.length > MAX_CHARS;
    return { texto: truncado ? text.slice(0, MAX_CHARS) : text, truncado, fuente: `https://www.gutenberg.org/ebooks/${data.id}` };
  });
