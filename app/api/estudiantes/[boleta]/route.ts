import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ boleta: string }> }
) {
  try {
    const { boleta } = await params;

    if (!boleta || boleta.length !== 4) {
      return NextResponse.json({ error: 'Boleta inválida. Debe tener 4 dígitos.' }, { status: 400 });
    }

    const estudiante = await prisma.estudiante.findUnique({
      where: { boleta },
      select: {
        nombre: true,
        documento: true,
        telefono: true,
        asistencia: true,
      }
    });

    if (!estudiante) {
      return NextResponse.json({ error: 'Boleta no encontrada' }, { status: 404 });
    }

    return NextResponse.json(estudiante);
  } catch (error) {
    console.error('Error fetching boleta:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
