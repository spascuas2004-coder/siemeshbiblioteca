# SIEMESH MVP — Sistema de Gestión Bibliotecaria

Prototipo funcional (MVP) del proyecto SIEMESH — Sergio Andrés Pascuas Sierra, Ingeniería de Software, Politécnico Grancolombiano (Bogotá), 2026.

## Cuentas de prueba
| Rol | Correo | Contraseña |
|---|---|---|
| Administrador (Sergio Andrés Pascuas Sierra) | admin@poligran.edu.co | admin123 |
| Usuario / Estudiante (Sergio Pascuas) | user@poligran.edu.co | user123 |

Los botones de acceso rápido solo completan el formulario; hay que pulsar **Entrar**.

## Lector digital
Los 10 libros son obras de dominio público. El botón **Leer Libro** descarga el texto completo desde Project Gutenberg y lo muestra paginado, con capítulos, Anterior/Siguiente y tamaño de letra.

## Requisitos cubiertos
- **CRUD con procedimientos almacenados:** `database/siemesh.sql` (sp_crear_libro, sp_actualizar_libro, sp_inactivar_libro, sp_crear_usuario, sp_solicitar_prestamo, sp_aprobar_prestamo, sp_registrar_devolucion…). La app replica la misma lógica en `src/lib/siemesh/logic.ts`.
- **Validaciones, campos calculados y excepciones:** stock = 0, usuario sancionado, ISBN duplicado, stock negativo; `dias_mora = MAX(0, fecha_devolucion − fecha_limite)`.
- **Login con 2 roles** (Administrador / Usuario) y registro de nuevos usuarios con rol y estado.
- **3 reportes planos** exportables a CSV/Excel y PDF: inventario, historial de préstamos, morosos y sanciones.
- **2 reportes gráficos:** barras (top 5 libros) y torta (préstamos por estado).
- **Trigger** `trg_actualizar_stock_prestamo` (−1 al entregar, +1 al devolver).

## Ejecutar en tu PC
Requiere Node.js 20+ (o Bun).
```bash
npm install
npm run dev      # abre http://localhost:8080
npm test         # pruebas de reglas de negocio (si está disponible: npx vitest run)
```
Los datos se guardan en el navegador (localStorage). El botón ↺ del administrador restablece los datos de demostración.

## Base de datos (PostgreSQL)
```bash
psql -U postgres -c "CREATE DATABASE siemesh;"
psql -U postgres -d siemesh -f database/siemesh.sql
```
