// Lógica de negocio de SIEMESH MVP. Simula los procedimientos almacenados y el trigger
// definidos en database/siemesh.sql (funciones puras: reciben estado y devuelven estado nuevo).

export type Rol = "Administrador" | "Usuario";
export type EstadoUsuario = "Activo" | "Sancionado" | "Inactivo";
export type EstadoPrestamo = "Solicitado" | "Entregado" | "Devuelto" | "Vencido";

export interface Usuario { id_usuario: number; nombre: string; correo: string; password: string; estado: EstadoUsuario; rol: Rol }
export interface Libro { id_libro: number; isbn: string; titulo: string; autor: string; categoria: string; stock_total: number; stock_disponible: number; estado: "Activo" | "Inactivo"; gutenberg_id?: number | null }
export interface Prestamo { id_prestamo: number; id_usuario: number; id_libro: number; fecha_prestamo: string; fecha_limite: string; fecha_devolucion: string | null; estado: EstadoPrestamo }
export interface Sancion { id_sancion: number; id_usuario: number; id_prestamo: number; dias_mora: number; motivo: string; estado: "Activa" | "Cumplida" }
export interface DB { usuarios: Usuario[]; libros: Libro[]; prestamos: Prestamo[]; sanciones: Sancion[]; log: string[] }

export const DIAS_PRESTAMO = 7;

export const hoy = () => new Date().toISOString().slice(0, 10);
export const sumarDias = (fecha: string, dias: number) => {
  const d = new Date(fecha + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + dias); return d.toISOString().slice(0, 10);
};
/** Campo calculado: dias_mora = MAX(0, fecha_devolucion - fecha_limite) */
export const diasMora = (limite: string, devolucion: string) =>
  Math.max(0, Math.round((Date.parse(devolucion) - Date.parse(limite)) / 86400000));

export function seed(): DB {
  const t = hoy();
  // Obras de dominio público con texto completo en Project Gutenberg (gutenberg_id)
  const libros: [string, string, string, string, number, number][] = [
    ["978-8420412146", "Don Quijote de la Mancha", "Miguel de Cervantes", "Literatura", 4, 2000],
    ["978-8437604572", "Niebla", "Miguel de Unamuno", "Literatura", 3, 49836],
    ["978-8437617596", "Fortunata y Jacinta", "Benito Pérez Galdós", "Literatura", 2, 17013],
    ["978-8467034677", "Libro de Buen Amor", "Arcipreste de Hita", "Literatura", 2, 16625],
    ["978-0141439518", "Pride and Prejudice", "Jane Austen", "Literatura", 3, 1342],
    ["978-0486282114", "Frankenstein", "Mary Shelley", "Literatura", 3, 84],
    ["978-0141439761", "Alice's Adventures in Wonderland", "Lewis Carroll", "Literatura", 5, 11],
    ["978-0451529060", "On the Origin of Species", "Charles Darwin", "Ciencias", 2, 1228],
    ["978-0486417141", "Relativity: The Special and General Theory", "Albert Einstein", "Ciencias", 3, 30155],
    ["978-0140449150", "The Prince", "Nicolás Maquiavelo", "Filosofía", 4, 1232],
  ];
  const db: DB = {
    usuarios: [
      { id_usuario: 1, nombre: "Sergio Andrés Pascuas Sierra", correo: "admin@poligran.edu.co", password: "admin123", estado: "Activo", rol: "Administrador" },
      { id_usuario: 2, nombre: "Sergio Pascuas", correo: "user@poligran.edu.co", password: "user123", estado: "Activo", rol: "Usuario" },
    ],
    libros: libros.map(([isbn, titulo, autor, categoria, s, g], i) => ({ id_libro: i + 1, isbn, titulo, autor, categoria, stock_total: s, stock_disponible: s, estado: "Activo", gutenberg_id: g })),
    prestamos: [], sanciones: [], log: [],
  };
  // Historial de ejemplo para que las gráficas tengan datos
  const hist: [number, number, number, EstadoPrestamo][] = [[2, 1, -20, "Devuelto"], [2, 6, -18, "Devuelto"], [2, 1, -15, "Devuelto"], [2, 7, -12, "Devuelto"], [2, 6, -4, "Entregado"]];
  hist.forEach(([u, l, off, est], i) => {
    const f = sumarDias(t, off);
    db.prestamos.push({ id_prestamo: i + 1, id_usuario: u, id_libro: l, fecha_prestamo: f, fecha_limite: sumarDias(f, DIAS_PRESTAMO), fecha_devolucion: est === "Devuelto" ? sumarDias(f, 5) : null, estado: est });
    if (est === "Entregado") db.libros[l - 1]!.stock_disponible -= 1;
  });
  return db;
}

const nextId = (arr: { [k: string]: unknown }[], key: string) => Math.max(0, ...arr.map((x) => x[key] as number)) + 1;
const clone = (db: DB): DB => structuredClone(db);

/** Trigger trg_actualizar_stock_prestamo */
function trigger(db: DB, antes: EstadoPrestamo | null, p: Prestamo) {
  const libro = db.libros.find((l) => l.id_libro === p.id_libro)!;
  if (antes === "Solicitado" && p.estado === "Entregado") {
    if (libro.stock_disponible <= 0) throw new Error("Excepción: el stock no puede quedar negativo.");
    libro.stock_disponible -= 1;
    db.log.unshift(`Trigger ejecutado: stock de "${libro.titulo}" −1 → ${libro.stock_disponible}`);
  }
  if ((antes === "Entregado" || antes === "Vencido") && p.estado === "Devuelto") {
    libro.stock_disponible += 1;
    db.log.unshift(`Trigger ejecutado: stock de "${libro.titulo}" +1 → ${libro.stock_disponible}`);
  }
}

/** sp_solicitar_prestamo */
export function solicitarPrestamo(src: DB, id_usuario: number, id_libro: number, fecha = hoy()): DB {
  const db = clone(src);
  const u = db.usuarios.find((x) => x.id_usuario === id_usuario);
  const l = db.libros.find((x) => x.id_libro === id_libro);
  if (!u || !l) throw new Error("Usuario o libro inexistente.");
  if (u.estado === "Sancionado" || db.sanciones.some((s) => s.id_usuario === id_usuario && s.estado === "Activa"))
    throw new Error("No puedes solicitar préstamos: tienes una sanción activa.");
  if (u.estado !== "Activo") throw new Error("Tu cuenta está inactiva.");
  if (l.estado !== "Activo") throw new Error("Este libro está inactivo.");
  if (l.stock_disponible <= 0) throw new Error("No hay copias disponibles de este libro.");
  if (db.prestamos.some((p) => p.id_usuario === id_usuario && p.id_libro === id_libro && (p.estado === "Solicitado" || p.estado === "Entregado")))
    throw new Error("Ya tienes un préstamo activo de este libro.");
  db.prestamos.push({ id_prestamo: nextId(db.prestamos as never, "id_prestamo"), id_usuario, id_libro, fecha_prestamo: fecha, fecha_limite: sumarDias(fecha, DIAS_PRESTAMO), fecha_devolucion: null, estado: "Solicitado" });
  return db;
}

/** sp_aprobar_prestamo */
export function aprobarPrestamo(src: DB, id_prestamo: number, fecha = hoy()): DB {
  const db = clone(src);
  const p = db.prestamos.find((x) => x.id_prestamo === id_prestamo);
  if (!p) throw new Error("El préstamo especificado no existe.");
  if (p.estado !== "Solicitado") throw new Error("Solo se pueden aprobar préstamos en estado Solicitado.");
  p.estado = "Entregado"; p.fecha_prestamo = fecha; p.fecha_limite = sumarDias(fecha, DIAS_PRESTAMO);
  trigger(db, "Solicitado", p);
  return db;
}

/** sp_registrar_devolucion */
export function registrarDevolucion(src: DB, id_prestamo: number, fecha_devolucion: string): DB {
  const db = clone(src);
  const p = db.prestamos.find((x) => x.id_prestamo === id_prestamo);
  if (!p) throw new Error("El préstamo especificado no existe.");
  if (p.estado !== "Entregado" && p.estado !== "Vencido") throw new Error("Solo se pueden devolver préstamos entregados o vencidos.");
  if (fecha_devolucion < p.fecha_prestamo) throw new Error("La fecha de devolución no puede ser anterior a la del préstamo.");
  const antes = p.estado;
  p.estado = "Devuelto"; p.fecha_devolucion = fecha_devolucion;
  trigger(db, antes, p);
  const mora = diasMora(p.fecha_limite, fecha_devolucion);
  if (mora > 0) {
    db.sanciones.push({ id_sancion: nextId(db.sanciones as never, "id_sancion"), id_usuario: p.id_usuario, id_prestamo: p.id_prestamo, dias_mora: mora, motivo: `Devolución tardía (${mora} días de mora)`, estado: "Activa" });
    db.usuarios.find((u) => u.id_usuario === p.id_usuario)!.estado = "Sancionado";
  }
  return db;
}

/** Marca como Vencido todo préstamo entregado cuya fecha límite ya pasó. */
export function actualizarVencidos(src: DB, fecha = hoy()): DB {
  if (!src.prestamos.some((p) => p.estado === "Entregado" && p.fecha_limite < fecha)) return src;
  const db = clone(src);
  db.prestamos.forEach((p) => { if (p.estado === "Entregado" && p.fecha_limite < fecha) p.estado = "Vencido"; });
  return db;
}

export function levantarSancion(src: DB, id_usuario: number): DB {
  const db = clone(src);
  db.sanciones.forEach((s) => { if (s.id_usuario === id_usuario) s.estado = "Cumplida"; });
  db.usuarios.find((u) => u.id_usuario === id_usuario)!.estado = "Activo";
  return db;
}

/** sp_guardar_libro (crear / actualizar) */
export function guardarLibro(src: DB, data: Omit<Libro, "id_libro" | "stock_disponible" | "estado" | "gutenberg_id"> & { id_libro?: number; gutenberg_id?: number | null }): DB {
  const db = clone(src);
  for (const k of ["isbn", "titulo", "autor", "categoria"] as const) if (!String(data[k] ?? "").trim()) throw new Error(`El campo ${k} es obligatorio.`);
  if (!Number.isInteger(data.stock_total) || data.stock_total < 0) throw new Error("El stock total no puede ser negativo.");
  if (db.libros.some((l) => l.isbn === data.isbn.trim() && l.id_libro !== data.id_libro)) throw new Error(`Excepción: el ISBN ${data.isbn} ya está registrado.`);
  if (data.id_libro) {
    const l = db.libros.find((x) => x.id_libro === data.id_libro)!;
    const prestados = l.stock_total - l.stock_disponible;
    if (data.stock_total < prestados) throw new Error(`Excepción: hay ${prestados} copias prestadas; el stock total no puede ser menor.`);
    Object.assign(l, { isbn: data.isbn.trim(), titulo: data.titulo.trim(), autor: data.autor.trim(), categoria: data.categoria.trim(), stock_total: data.stock_total, stock_disponible: data.stock_total - prestados, gutenberg_id: data.gutenberg_id ?? l.gutenberg_id ?? null });
  } else {
    db.libros.push({ id_libro: nextId(db.libros as never, "id_libro"), isbn: data.isbn.trim(), titulo: data.titulo.trim(), autor: data.autor.trim(), categoria: data.categoria.trim(), stock_total: data.stock_total, stock_disponible: data.stock_total, estado: "Activo", gutenberg_id: data.gutenberg_id ?? null });
  }
  return db;
}

export function toggleLibro(src: DB, id_libro: number): DB {
  const db = clone(src); const l = db.libros.find((x) => x.id_libro === id_libro)!;
  l.estado = l.estado === "Activo" ? "Inactivo" : "Activo"; return db;
}

export interface NuevoUsuario { nombre: string; correo: string; password: string; rol: Rol; estado: "Activo" | "Inactivo" }
/** sp_crear_usuario: el usuario creado puede iniciar sesión de inmediato. */
export function guardarUsuario(src: DB, data: NuevoUsuario): DB {
  const db = clone(src);
  if (!data.nombre.trim() || !data.correo.trim() || !data.password) throw new Error("Nombre, correo y contraseña son obligatorios.");
  if (!/^\S+@\S+\.\S+$/.test(data.correo.trim())) throw new Error("Correo inválido.");
  if (data.password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres.");
  if (db.usuarios.some((u) => u.correo.toLowerCase() === data.correo.trim().toLowerCase())) throw new Error("Excepción: el correo ya está registrado.");
  db.usuarios.push({ id_usuario: nextId(db.usuarios as never, "id_usuario"), nombre: data.nombre.trim(), correo: data.correo.trim().toLowerCase(), password: data.password, estado: data.estado, rol: data.rol });
  return db;
}

export function toggleUsuario(src: DB, id_usuario: number): DB {
  const db = clone(src); const u = db.usuarios.find((x) => x.id_usuario === id_usuario)!;
  if (u.id_usuario === 1) throw new Error("No se puede inactivar al administrador principal.");
  u.estado = u.estado === "Inactivo" ? "Activo" : "Inactivo"; return db;
}

export function login(db: DB, correo: string, password: string): Usuario {
  const u = db.usuarios.find((x) => x.correo.toLowerCase() === correo.trim().toLowerCase() && x.password === password);
  if (!u) throw new Error("Correo o contraseña incorrectos.");
  if (u.estado === "Inactivo") throw new Error("Tu cuenta está inactiva. Contacta al administrador.");
  return u;
}
