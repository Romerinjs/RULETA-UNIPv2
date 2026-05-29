import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from "@/auth";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { estudiantes } = body;

    if (!Array.isArray(estudiantes) || estudiantes.length === 0) {
      return NextResponse.json({ error: 'Payload inválido. Se espera un array "estudiantes".' }, { status: 400 });
    }

    // Validar que las boletas tengan 4 caracteres
    for (const est of estudiantes) {
      if (!est.boleta || est.boleta.length !== 4) {
         return NextResponse.json({ error: `La boleta ${est.boleta} no es de 4 caracteres.` }, { status: 400 });
      }
    }

    const result = await prisma.estudiante.createMany({
      data: estudiantes,
      skipDuplicates: true, // Opcional: ignorar duplicados por si se corre 2 veces
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error('Error en carga masiva:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
