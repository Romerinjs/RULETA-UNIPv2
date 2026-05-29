-- CreateTable
CREATE TABLE "Estudiante" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "boleta" TEXT NOT NULL,
    "telefono" TEXT,
    "asistencia" BOOLEAN NOT NULL DEFAULT false,
    "ganador" BOOLEAN NOT NULL DEFAULT false,
    "programaId" INTEGER NOT NULL,
    "semestreId" INTEGER NOT NULL,
    "grupoId" INTEGER NOT NULL,

    CONSTRAINT "Estudiante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Programa" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Programa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Semestre" (
    "id" SERIAL NOT NULL,
    "numero" INTEGER NOT NULL,

    CONSTRAINT "Semestre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grupo" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Grupo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Estudiante_documento_key" ON "Estudiante"("documento");

-- CreateIndex
CREATE UNIQUE INDEX "Estudiante_boleta_key" ON "Estudiante"("boleta");

-- CreateIndex
CREATE INDEX "Estudiante_asistencia_ganador_idx" ON "Estudiante"("asistencia", "ganador");

-- CreateIndex
CREATE UNIQUE INDEX "Programa_nombre_key" ON "Programa"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Semestre_numero_key" ON "Semestre"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "Grupo_nombre_key" ON "Grupo"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- AddForeignKey
ALTER TABLE "Estudiante" ADD CONSTRAINT "Estudiante_programaId_fkey" FOREIGN KEY ("programaId") REFERENCES "Programa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estudiante" ADD CONSTRAINT "Estudiante_semestreId_fkey" FOREIGN KEY ("semestreId") REFERENCES "Semestre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estudiante" ADD CONSTRAINT "Estudiante_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "Grupo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
