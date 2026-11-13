import { describe, expect, it } from "vitest";
import { aprobarPrestamo, diasMora, guardarLibro, guardarUsuario, login, registrarDevolucion, seed, solicitarPrestamo, sumarDias } from "./logic";

describe("SIEMESH reglas de negocio", () => {
  it("el catálogo inicia con 10 libros y 2 cuentas", () => {
    const db = seed(); expect(db.libros).toHaveLength(10); expect(db.usuarios).toHaveLength(2);
  });
  it("cuentas por defecto con sus nombres", () => {
    expect(login(seed(), "admin@poligran.edu.co", "admin123").nombre).toBe("Sergio Andrés Pascuas Sierra");
    expect(login(seed(), "user@poligran.edu.co", "user123").nombre).toBe("Sergio Pascuas");
  });
  it("un usuario nuevo puede iniciar sesión de inmediato con su rol", () => {
    const db = guardarUsuario(seed(), { nombre: "Ana", correo: "ana@poligran.edu.co", password: "clave123", rol: "Administrador", estado: "Activo" });
    expect(login(db, "ana@poligran.edu.co", "clave123").rol).toBe("Administrador");
  });
  it("un usuario creado como Inactivo no puede iniciar sesión", () => {
    const db = guardarUsuario(seed(), { nombre: "Ana", correo: "ana@poligran.edu.co", password: "clave123", rol: "Usuario", estado: "Inactivo" });
    expect(() => login(db, "ana@poligran.edu.co", "clave123")).toThrow(/inactiva/);
  });
  it("aprobar un préstamo resta 1 al stock (trigger)", () => {
    let db = seed(); const antes = db.libros[1]!.stock_disponible;
    db = solicitarPrestamo(db, 2, 2); const id = db.prestamos.at(-1)!.id_prestamo;
    db = aprobarPrestamo(db, id); expect(db.libros[1]!.stock_disponible).toBe(antes - 1);
  });
  it("devolución tardía suma 1 al stock, crea sanción y sanciona al usuario", () => {
    let db = solicitarPrestamo(seed(), 2, 2, "2026-01-01"); const id = db.prestamos.at(-1)!.id_prestamo;
    db = aprobarPrestamo(db, id, "2026-01-01"); const stock = db.libros[1]!.stock_disponible;
    db = registrarDevolucion(db, id, sumarDias("2026-01-08", 3));
    expect(db.libros[1]!.stock_disponible).toBe(stock + 1);
    expect(db.sanciones.at(-1)!.dias_mora).toBe(3);
    expect(db.usuarios[1]!.estado).toBe("Sancionado");
  });
  it("un usuario sancionado no puede solicitar", () => {
    const db = seed(); db.usuarios[1]!.estado = "Sancionado";
    expect(() => solicitarPrestamo(db, 2, 3)).toThrow(/sanción/);
  });
  it("no se puede solicitar sin stock disponible", () => {
    const db = seed(); db.libros[9]!.stock_disponible = 0;
    expect(() => solicitarPrestamo(db, 2, 10)).toThrow(/copias/);
  });
  it("ISBN duplicado lanza excepción", () => {
    expect(() => guardarLibro(seed(), { isbn: "978-8420412146", titulo: "x", autor: "y", categoria: "z", stock_total: 1 })).toThrow(/ISBN/);
  });
  it("dias_mora nunca es negativo", () => { expect(diasMora("2026-01-10", "2026-01-05")).toBe(0); });
  it("login con credenciales de prueba", () => {
    expect(login(seed(), "admin@poligran.edu.co", "admin123").rol).toBe("Administrador");
    expect(() => login(seed(), "user@poligran.edu.co", "mal")).toThrow();
  });
});
