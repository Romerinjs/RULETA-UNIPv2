import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt"; // Asegúrate de tener bcrypt instalado

const prisma = new PrismaClient();

async function main() {
  // 1. Encriptar la contraseña
  const hashedPassword = await bcrypt.hash("admin123", 10);

  // 2. Insertar el administrador usando upsert
  await prisma.admin.upsert({
    where: { email: "admin@evento.com" },
    update: {}, // Si ya existe, no hacemos nada
    create: {
      nombre: "Administrador Principal",
      email: "admin@evento.com",
      password: hashedPassword, // Aquí guardamos el hash, NO el texto plano
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
