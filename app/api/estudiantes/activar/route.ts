import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { boleta, telefono } = body;

    if (!boleta || boleta.length !== 4) {
      return NextResponse.json({ error: 'Boleta inválida. Debe tener 4 dígitos.' }, { status: 400 });
    }

    if (!telefono) {
      return NextResponse.json({ error: 'El teléfono es requerido para activar la boleta.' }, { status: 400 });
    }

    const estudiante = await prisma.estudiante.findUnique({
      where: { boleta }
    });

    if (!estudiante) {
      return NextResponse.json({ error: 'Boleta no encontrada' }, { status: 404 });
    }

    if (estudiante.telefono !== null) {
      return NextResponse.json({ error: 'La boleta ya fue activada previamente.' }, { status: 400 });
    }

    const actualizado = await prisma.estudiante.update({
      where: { boleta },
      data: { telefono }
    });

    return NextResponse.json({ success: true, estudiante: actualizado });
  } catch (error) {
    console.error('Error en activación:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
