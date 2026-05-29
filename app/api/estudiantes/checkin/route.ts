import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { boleta } = body;

    if (!boleta || boleta.length !== 4) {
      return NextResponse.json({ error: 'Boleta inválida. Debe tener 4 dígitos.' }, { status: 400 });
    }

    // Buscar estudiante utilizando el índice @unique en 'boleta'
    const estudiante = await prisma.estudiante.findUnique({
      where: { boleta },
      select: {
        nombre: true,
        documento: true,
        telefono: true,
        asistencia: true,
        programa: {
          select: {
            nombre: true,
          },
        },
        semestre: {
          select: {
            numero: true,
          },
        },
        grupo: {
          select: {
            nombre: true,
          },
        },
      }
    });

    if (!estudiante) {
      return NextResponse.json({ error: 'Boleta no encontrada' }, { status: 404 });
    }

    // Pre-requisito obligatorio: Debe estar activado (tener teléfono registrado)
    if (estudiante.telefono === null) {
      return NextResponse.json(
        { error: 'Primero debes activar tu boleta en /activar' },
        { status: 428 }
      );
    }

    // Si ya registró asistencia, retornamos un éxito informativo con estado 200
    if (estudiante.asistencia) {
      return NextResponse.json({
        success: true,
        yaRegistrado: true,
        message: 'El estudiante ya registró asistencia.',
        estudiante
      });
    }

    // Registrar asistencia física utilizando el índice @unique en 'boleta'
    const actualizado = await prisma.estudiante.update({
      where: { boleta },
      data: {
        asistencia: true
      },
      select: {
        nombre: true,
        documento: true,
        telefono: true,
        asistencia: true,
        programa: {
          select: {
            nombre: true,
          },
        },
        semestre: {
          select: {
            numero: true,
          },
        },
        grupo: {
          select: {
            nombre: true,
          },
        },
      }
    });

    return NextResponse.json({ success: true, estudiante: actualizado });
  } catch (error) {
    console.error('Error en checkin:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
