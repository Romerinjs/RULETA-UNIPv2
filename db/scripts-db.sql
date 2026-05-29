-- Usar ruleta-v2 o nombre de la db
-- Insertar los 18 Programas Académicos
INSERT INTO "Programa" (nombre) VALUES
    ('ADM. DE EMPRESAS'),
    ('ADM. NEGOCIOS INTERNACIONALES'),
    ('CONTADURIA PUBLICA'),
    ('DESARROLLO DE SOFTWARE'),
    ('ESP. TALENTO HUMANO'),
    ('GESTION COMERCIO EXTERIOR'),
    ('GESTION CONTABLE'),
    ('GESTION EMPRESARIAL'),
    ('GESTION GASTRONOMICA'),
    ('INGENIERIA AGROINDUSTRIAL'),
    ('INGENIERIA AMBIENTAL'),
    ('INGENIERIA CIVIL'),
    ('INGENIERIA DE SISTEMAS'),
    ('INGENIERIA FORESTAL'),
    ('OBRAS CIVILES'),
    ('PRODUCCION AGROINDUSTRIAL'),
    ('RECURSOS FORESTALES'),
    ('SANEAMIENTO AMBIENTAL')
ON CONFLICT (nombre) DO NOTHING;

-- Insertar los 10 Semestres
INSERT INTO "Semestre" (numero) VALUES
    (1),
    (2),
    (3),
    (4),
    (5),
    (6),
    (7),
    (8),
    (9),
    (10)
ON CONFLICT (numero) DO NOTHING;

-- Insertar los Grupos
INSERT INTO "Grupo" (nombre) VALUES
    ('A'),
    ('B'),
    ('C'),
    ('D'),
    ('N')
ON CONFLICT (nombre) DO NOTHING;
