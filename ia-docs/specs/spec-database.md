# Software Design Document (SDD) - Backend & Database Spec

## 1. Contexto del Proyecto
Desarrollo de un backend monolítico en Node.js utilizando Prisma ORM y PostgreSQL. El sistema gestionará la activación de boletas, registro de asistencia (check-in) y un sorteo en vivo (ruleta) para un evento masivo. 
El despliegue se realizará mediante Dokploy en un VPS (2 vCPU, 8 GB RAM). El rendimiento y la eficiencia de las consultas SQL son críticos para evitar cuellos de botella en la CPU.

## 2. Reglas Estrictas de Arquitectura (Directivas para la IA)
- **Cero iteraciones HTTP masivas:** Las cargas de datos masivos se hacen en operaciones bulk en base de datos.
- **Eficiencia de Índices:** Las búsquedas de usuarios deben realizarse SIEMPRE usando la columna `boleta` que está indexada con `@unique`.
- **Cero Booleanos Únicos:** Los estados lógicos (`asistencia`, `ganador`) NO deben tener restricciones `UNIQUE`, ya que cientos de usuarios compartirán el mismo estado simultáneamente.
- **Sorteo en Memoria:** La base de datos no debe usar `ORDER BY RAND()`. El backend debe recuperar los IDs válidos, seleccionar uno aleatoriamente en Node.js, y luego actualizar ese registro.

## 3. Especificación del Esquema de Base de Datos (Prisma Spec)

A continuación, la estructura exacta requerida para `schema.prisma`. 

*Nota Arquitectónica: Se incluye un índice compuesto `@@index([asistencia, ganador])` en la tabla Estudiante. Esto es un requisito estricto para que las consultas de la ruleta del viernes se resuelvan en < 1ms.*

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Estudiante {
  id          String   @id @default(uuid())
  nombre      String
  documento   String   @unique
  boleta      String   @unique
  telefono    String?  // Opcional en la fase de carga, obligatorio en activación
  
  asistencia  Boolean  @default(false)
  ganador     Boolean  @default(false)

  programaId  Int
  programa    Programa @relation(fields: [programaId], references: [id])
  semestreId  Int
  semestre    Semestre @relation(fields: [semestreId], references: [id])
  grupoId     Int
  grupo       Grupo    @relation(fields: [grupoId], references: [id])

  // Índice compuesto crítico para la ruleta
  @@index([asistencia, ganador])
}

model Programa {
  id          Int          @id @default(autoincrement())
  nombre      String       @unique
  estudiantes Estudiante[]
}

model Semestre {
  id          Int          @id @default(autoincrement())
  numero      Int          @unique
  estudiantes Estudiante[]
}

model Grupo {
  id          Int          @id @default(autoincrement())
  nombre      String       @unique
  estudiantes Estudiante[]
}

model Admin {
  id          Int      @id @default(autoincrement())
  nombre      String
  email       String   @unique
  password    String   
}
