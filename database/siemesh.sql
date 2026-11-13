-- =====================================================================
-- SIEMESH MVP — Sistema de Gestión Bibliotecaria (PostgreSQL)
-- Autor: Sergio Andrés Pascuas Sierra — Politécnico Grancolombiano
-- 5 tablas, CRUD con procedimientos almacenados, validaciones,
-- campos calculados, manejo de excepciones y 1 trigger.
-- =====================================================================

DROP TABLE IF EXISTS sanciones, prestamos, libros, usuarios, roles CASCADE;

CREATE TABLE roles (
  id_rol      SERIAL PRIMARY KEY,
  nombre_rol  VARCHAR(30) UNIQUE NOT NULL
);

CREATE TABLE usuarios (
  id_usuario    SERIAL PRIMARY KEY,
  nombre        VARCHAR(100) NOT NULL,
  correo        VARCHAR(120) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  estado        VARCHAR(20) NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo','Sancionado','Inactivo')),
  id_rol        INT NOT NULL REFERENCES roles(id_rol)
);

CREATE TABLE libros (
  id_libro         SERIAL PRIMARY KEY,
  isbn             VARCHAR(20) UNIQUE NOT NULL,
  titulo           VARCHAR(180) NOT NULL,
  autor            VARCHAR(120) NOT NULL,
  categoria        VARCHAR(60) NOT NULL,
  stock_total      INT NOT NULL CHECK (stock_total >= 0),
  stock_disponible INT NOT NULL CHECK (stock_disponible >= 0),
  estado           VARCHAR(20) NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo','Inactivo')),
  gutenberg_id     INT NULL,  -- texto libre en Project Gutenberg (lector digital)
  CHECK (stock_disponible <= stock_total)
);

CREATE TABLE prestamos (
  id_prestamo      SERIAL PRIMARY KEY,
  id_usuario       INT NOT NULL REFERENCES usuarios(id_usuario),
  id_libro         INT NOT NULL REFERENCES libros(id_libro),
  fecha_prestamo   DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_limite     DATE NOT NULL,
  fecha_devolucion DATE NULL,
  estado           VARCHAR(20) NOT NULL CHECK (estado IN ('Solicitado','Entregado','Devuelto','Vencido'))
);

CREATE TABLE sanciones (
  id_sancion  SERIAL PRIMARY KEY,
  id_usuario  INT NOT NULL REFERENCES usuarios(id_usuario),
  id_prestamo INT NOT NULL REFERENCES prestamos(id_prestamo),
  dias_mora   INT NOT NULL CHECK (dias_mora >= 0),
  motivo      VARCHAR(200) NOT NULL,
  estado      VARCHAR(20) NOT NULL DEFAULT 'Activa' CHECK (estado IN ('Activa','Cumplida'))
);

-- Vista con campo calculado dias_mora
CREATE OR REPLACE VIEW v_prestamos AS
SELECT p.*, GREATEST(0, COALESCE(p.fecha_devolucion, CURRENT_DATE) - p.fecha_limite) AS dias_mora
FROM prestamos p;

-- =====================================================================
-- TRIGGER: actualización automática de stock
-- =====================================================================
CREATE OR REPLACE FUNCTION fn_actualizar_stock_libro() RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.estado = 'Entregado') OR
     (TG_OP = 'UPDATE' AND OLD.estado = 'Solicitado' AND NEW.estado = 'Entregado') THEN
    UPDATE libros SET stock_disponible = stock_disponible - 1
    WHERE id_libro = NEW.id_libro AND stock_disponible > 0;
    IF NOT FOUND THEN RAISE EXCEPTION 'Stock insuficiente: no puede quedar negativo.'; END IF;
  END IF;
  IF (TG_OP = 'UPDATE' AND OLD.estado IN ('Entregado','Vencido') AND NEW.estado = 'Devuelto') THEN
    UPDATE libros SET stock_disponible = stock_disponible + 1 WHERE id_libro = NEW.id_libro;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_actualizar_stock_prestamo
AFTER INSERT OR UPDATE ON prestamos
FOR EACH ROW EXECUTE FUNCTION fn_actualizar_stock_libro();

-- =====================================================================
-- CRUD LIBROS
-- =====================================================================
CREATE OR REPLACE PROCEDURE sp_crear_libro(p_isbn VARCHAR, p_titulo VARCHAR, p_autor VARCHAR, p_categoria VARCHAR, p_stock INT)
LANGUAGE plpgsql AS $$
BEGIN
  IF p_stock < 0 THEN RAISE EXCEPTION 'El stock no puede ser negativo.'; END IF;
  INSERT INTO libros (isbn, titulo, autor, categoria, stock_total, stock_disponible)
  VALUES (p_isbn, p_titulo, p_autor, p_categoria, p_stock, p_stock);
EXCEPTION
  WHEN unique_violation THEN RAISE EXCEPTION 'El ISBN % ya está registrado.', p_isbn;
END; $$;

CREATE OR REPLACE FUNCTION fn_leer_libros(p_filtro VARCHAR DEFAULT NULL)
RETURNS SETOF libros LANGUAGE sql AS $$
  SELECT * FROM libros
  WHERE p_filtro IS NULL OR titulo ILIKE '%'||p_filtro||'%' OR autor ILIKE '%'||p_filtro||'%' OR categoria ILIKE '%'||p_filtro||'%'
  ORDER BY titulo;
$$;

CREATE OR REPLACE PROCEDURE sp_actualizar_libro(p_id INT, p_isbn VARCHAR, p_titulo VARCHAR, p_autor VARCHAR, p_categoria VARCHAR, p_stock INT)
LANGUAGE plpgsql AS $$
DECLARE v_prestados INT;
BEGIN
  SELECT stock_total - stock_disponible INTO v_prestados FROM libros WHERE id_libro = p_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'El libro % no existe.', p_id; END IF;
  IF p_stock < v_prestados THEN RAISE EXCEPTION 'Hay % copias prestadas; stock insuficiente.', v_prestados; END IF;
  UPDATE libros SET isbn = p_isbn, titulo = p_titulo, autor = p_autor, categoria = p_categoria,
         stock_total = p_stock, stock_disponible = p_stock - v_prestados
  WHERE id_libro = p_id;
EXCEPTION
  WHEN unique_violation THEN RAISE EXCEPTION 'El ISBN % ya está registrado.', p_isbn;
END; $$;

CREATE OR REPLACE PROCEDURE sp_inactivar_libro(p_id INT)
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE libros SET estado = CASE WHEN estado = 'Activo' THEN 'Inactivo' ELSE 'Activo' END WHERE id_libro = p_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'El libro % no existe.', p_id; END IF;
END; $$;

-- =====================================================================
-- CRUD USUARIOS
-- =====================================================================
CREATE OR REPLACE PROCEDURE sp_crear_usuario(p_nombre VARCHAR, p_correo VARCHAR, p_hash VARCHAR, p_id_rol INT DEFAULT 2, p_estado VARCHAR DEFAULT 'Activo')
LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO usuarios (nombre, correo, password_hash, id_rol, estado) VALUES (p_nombre, lower(p_correo), p_hash, p_id_rol, p_estado);
EXCEPTION
  WHEN unique_violation THEN RAISE EXCEPTION 'El correo % ya está registrado.', p_correo;
  WHEN foreign_key_violation THEN RAISE EXCEPTION 'El rol % no existe.', p_id_rol;
END; $$;

CREATE OR REPLACE PROCEDURE sp_cambiar_estado_usuario(p_id INT, p_estado VARCHAR)
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE usuarios SET estado = p_estado WHERE id_usuario = p_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'El usuario % no existe.', p_id; END IF;
END; $$;

CREATE OR REPLACE PROCEDURE sp_levantar_sancion(p_id_usuario INT)
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE sanciones SET estado = 'Cumplida' WHERE id_usuario = p_id_usuario AND estado = 'Activa';
  UPDATE usuarios SET estado = 'Activo' WHERE id_usuario = p_id_usuario;
END; $$;

-- =====================================================================
-- PRÉSTAMOS
-- =====================================================================
CREATE OR REPLACE PROCEDURE sp_solicitar_prestamo(p_id_usuario INT, p_id_libro INT)
LANGUAGE plpgsql AS $$
DECLARE v_estado VARCHAR; v_stock INT;
BEGIN
  SELECT estado INTO v_estado FROM usuarios WHERE id_usuario = p_id_usuario;
  IF NOT FOUND THEN RAISE EXCEPTION 'El usuario no existe.'; END IF;
  IF v_estado = 'Sancionado' THEN RAISE EXCEPTION 'El usuario tiene una sanción activa.'; END IF;
  IF v_estado <> 'Activo' THEN RAISE EXCEPTION 'La cuenta está inactiva.'; END IF;
  SELECT stock_disponible INTO v_stock FROM libros WHERE id_libro = p_id_libro AND estado = 'Activo';
  IF NOT FOUND THEN RAISE EXCEPTION 'El libro no existe o está inactivo.'; END IF;
  IF v_stock = 0 THEN RAISE EXCEPTION 'No hay copias disponibles.'; END IF;
  INSERT INTO prestamos (id_usuario, id_libro, fecha_prestamo, fecha_limite, estado)
  VALUES (p_id_usuario, p_id_libro, CURRENT_DATE, CURRENT_DATE + 7, 'Solicitado');
END; $$;

CREATE OR REPLACE PROCEDURE sp_aprobar_prestamo(p_id_prestamo INT)
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE prestamos SET estado = 'Entregado', fecha_prestamo = CURRENT_DATE, fecha_limite = CURRENT_DATE + 7
  WHERE id_prestamo = p_id_prestamo AND estado = 'Solicitado';  -- activa el trigger (-1 stock)
  IF NOT FOUND THEN RAISE EXCEPTION 'Préstamo inexistente o no está en estado Solicitado.'; END IF;
END; $$;

CREATE OR REPLACE PROCEDURE sp_registrar_devolucion(p_id_prestamo INT, p_fecha_devolucion DATE)
LANGUAGE plpgsql AS $$
DECLARE v_fecha_limite DATE; v_id_usuario INT; v_dias_mora INT;
BEGIN
  SELECT fecha_limite, id_usuario INTO v_fecha_limite, v_id_usuario
  FROM prestamos WHERE id_prestamo = p_id_prestamo AND estado IN ('Entregado','Vencido');
  IF NOT FOUND THEN RAISE EXCEPTION 'El préstamo especificado no existe o no está entregado.'; END IF;

  UPDATE prestamos SET fecha_devolucion = p_fecha_devolucion, estado = 'Devuelto'
  WHERE id_prestamo = p_id_prestamo;  -- activa el trigger (+1 stock)

  v_dias_mora := GREATEST(0, p_fecha_devolucion - v_fecha_limite);  -- campo calculado
  IF v_dias_mora > 0 THEN
    INSERT INTO sanciones (id_usuario, id_prestamo, dias_mora, motivo, estado)
    VALUES (v_id_usuario, p_id_prestamo, v_dias_mora, 'Devolución tardía (' || v_dias_mora || ' días de mora)', 'Activa');
    UPDATE usuarios SET estado = 'Sancionado' WHERE id_usuario = v_id_usuario;
  END IF;
END; $$;

-- =====================================================================
-- REPORTES
-- =====================================================================
CREATE OR REPLACE VIEW rpt_inventario AS
SELECT isbn, titulo, autor, categoria, stock_total, stock_disponible, stock_total - stock_disponible AS prestados, estado FROM libros;

CREATE OR REPLACE VIEW rpt_historial_prestamos AS
SELECT p.id_prestamo, u.nombre, l.titulo, p.fecha_prestamo, p.fecha_limite, p.fecha_devolucion, p.estado, v.dias_mora
FROM prestamos p JOIN usuarios u USING (id_usuario) JOIN libros l USING (id_libro) JOIN v_prestamos v USING (id_prestamo);

CREATE OR REPLACE VIEW rpt_morosos AS
SELECT u.nombre, u.correo, u.estado, s.dias_mora, s.motivo, s.estado AS estado_sancion
FROM sanciones s JOIN usuarios u USING (id_usuario);

CREATE OR REPLACE VIEW rpt_top_libros AS
SELECT l.titulo, COUNT(*) AS total FROM prestamos p JOIN libros l USING (id_libro)
WHERE p.estado <> 'Solicitado' GROUP BY l.titulo ORDER BY total DESC LIMIT 5;

-- =====================================================================
-- DATOS SEMILLA (las contraseñas en producción deben guardarse con hash, ej. crypt() de pgcrypto)
-- =====================================================================
INSERT INTO roles (id_rol, nombre_rol) VALUES (1, 'Administrador'), (2, 'Usuario');
INSERT INTO usuarios (nombre, correo, password_hash, id_rol) VALUES
 ('Sergio Andrés Pascuas Sierra', 'admin@poligran.edu.co', md5('admin123'), 1),
 ('Sergio Pascuas', 'user@poligran.edu.co', md5('user123'), 2);
-- Obras de dominio público (Project Gutenberg)
CALL sp_crear_libro('978-8420412146','Don Quijote de la Mancha','Miguel de Cervantes','Literatura',4);
CALL sp_crear_libro('978-8437604572','Niebla','Miguel de Unamuno','Literatura',3);
CALL sp_crear_libro('978-8437617596','Fortunata y Jacinta','Benito Pérez Galdós','Literatura',2);
CALL sp_crear_libro('978-8467034677','Libro de Buen Amor','Arcipreste de Hita','Literatura',2);
CALL sp_crear_libro('978-0141439518','Pride and Prejudice','Jane Austen','Literatura',3);
CALL sp_crear_libro('978-0486282114','Frankenstein','Mary Shelley','Literatura',3);
CALL sp_crear_libro('978-0141439761','Alice''s Adventures in Wonderland','Lewis Carroll','Literatura',5);
CALL sp_crear_libro('978-0451529060','On the Origin of Species','Charles Darwin','Ciencias',2);
CALL sp_crear_libro('978-0486417141','Relativity: The Special and General Theory','Albert Einstein','Ciencias',3);
CALL sp_crear_libro('978-0140449150','The Prince','Nicolás Maquiavelo','Filosofía',4);
UPDATE libros l SET gutenberg_id = v.g FROM (VALUES
 ('978-8420412146',2000),('978-8437604572',49836),('978-8437617596',17013),('978-8467034677',16625),('978-0141439518',1342),
 ('978-0486282114',84),('978-0141439761',11),('978-0451529060',1228),('978-0486417141',30155),('978-0140449150',1232)) AS v(isbn,g)
WHERE l.isbn = v.isbn;
