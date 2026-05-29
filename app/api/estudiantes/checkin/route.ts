import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { boleta, telefono } = body;

    if (!boleta || boleta.length !== 4) {
      return NextResponse.json({ error: 'Boleta inválida. Debe tener 4 dígitos.' }, { status: 400 });
    }

    const estudiante = await prisma.estudiante.findUnique({
      where: { boleta }
    });

    if (!estudiante) {
      return NextResponse.json({ error: 'Boleta no encontrada' }, { status: 404 });
    }

    if (estudiante.asistencia) {
      return NextResponse.json({ success: true, message: 'El estudiante ya registró asistencia.', estudiante });
    }

    // Fallback: si no completó la etapa 2 y no mandó el teléfono en este request
    if (estudiante.telefono === null && !telefono) {
      return NextResponse.json(
        { error: 'Debe proporcionar un número de teléfono (precondition required).' },
        { status: 428 }
      );
    }

    const dataToUpdate: { asistencia: boolean; telefono?: string } = { asistencia: true };
    if (telefono && estudiante.telefono === null) {
      dataToUpdate.telefono = telefono;
    }

    const actualizado = await prisma.estudiante.update({
      where: { boleta },
      data: dataToUpdate
    });

    return NextResponse.json({ success: true, estudiante: actualizado });
  } catch (error) {
    console.error('Error en checkin:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
