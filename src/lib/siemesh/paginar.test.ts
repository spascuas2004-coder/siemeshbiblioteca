import { describe, expect, it } from "vitest";
import { paginar } from "./paginar";

describe("visor: paginación", () => {
  it("detecta capítulos y empieza cada uno en página nueva", () => {
    const t = "Prólogo corto.\n\nCapítulo I. El inicio\n\nTexto uno.\n\nCapítulo II. La salida\n\nTexto dos.";
    const { paginas, capitulos } = paginar(t, 2000);
    expect(capitulos.map((c) => c.pagina)).toEqual([1, 2]);
    expect(paginas[2]!.parrafos[0]).toBe("Capítulo II. La salida");
  });
  it("respeta el tamaño de página", () => {
    const t = Array.from({ length: 10 }, () => "x".repeat(500)).join("\n\n");
    expect(paginar(t, 1000).paginas).toHaveLength(5);
  });
});
