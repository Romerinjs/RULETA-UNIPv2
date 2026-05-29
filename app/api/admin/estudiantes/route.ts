import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from "@/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    const whereClause = search ? {
      OR: [
        { boleta: { contains: search, mode: 'insensitive' as const } },
        { documento: { contains: search, mode: 'insensitive' as const } },
        { nombre: { contains: search, mode: 'insensitive' as const } }
      ]
    } : {};

    const [estudiantes, total] = await Promise.all([
      prisma.estudiante.findMany({
        where: whereClause,
        include: {
          programa: true,
          semestre: true,
          grupo: true,
        },
        orderBy: {
          nombre: 'asc'
        },
        skip,
        take: limit,
      }),
      prisma.estudiante.count({ where: whereClause })
    ]);

    return NextResponse.json({
      success: true,
      data: estudiantes,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching estudiantes:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
