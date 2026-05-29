import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Route Segment Config para forzar dinámico o revalidación temporal
export const revalidate = 3; // Revalidar cada 3 segundos, funciona como un mini-cache para no colapsar la DB.

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.ADMIN_SECRET_KEY}`) { ... }

    const asistentesCount = await prisma.estudiante.count({
      where: { asistencia: true }
    });
    
    const registradosCount = await prisma.estudiante.count({
        where: { telefono: { not: null } }
    });

    return NextResponse.json({
      asistentes: asistentesCount,
      registrados: registradosCount
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
