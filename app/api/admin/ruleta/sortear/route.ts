import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.ADMIN_SECRET_KEY}`) { ... }

    // Paso 1: Consultamos los IDs de los candidatos elegibles
    // Usa el índice compuesto @@index([asistencia, ganador]) y revisa telefono !== null
    const candidatos = await prisma.estudiante.findMany({
      where: {
        asistencia: true,
        ganador: false,
        telefono: { not: null }
      },
      select: { id: true }
    });

    if (candidatos.length === 0) {
      return NextResponse.json({ error: 'No hay candidatos válidos para el sorteo.' }, { status: 400 });
    }

    // Paso 2: Sorteo en Memoria RAM
    const randomIndex = Math.floor(Math.random() * candidatos.length);
    const ganadorId = candidatos[randomIndex].id;

    // Paso 3: Actualización y retorno
    const ganador = await prisma.estudiante.update({
      where: { id: ganadorId },
      data: { ganador: true },
      include: {
        programa: true,
        semestre: true,
        grupo: true
      }
    });

    return NextResponse.json({ success: true, ganador });
  } catch (error) {
    console.error('Error en sorteo:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
