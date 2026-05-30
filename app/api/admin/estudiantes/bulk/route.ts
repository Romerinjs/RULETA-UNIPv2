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

    const validos = [];
    const errores = [];

    // Validar formato en memoria
    for (let i = 0; i < estudiantes.length; i++) {
      const est = estudiantes[i];
      const fila = i + 1;

      if (!est.nombre || !est.documento || !est.boleta || !est.programaId || !est.semestreId || !est.grupoId) {
        errores.push({ fila, mensaje: "Faltan campos obligatorios" });
        continue;
      }

      if (String(est.boleta).length !== 4) {
         errores.push({ fila, mensaje: `La boleta ${est.boleta} no es de 4 caracteres.` });
         continue;
      }

      validos.push({
        nombre: String(est.nombre),
        documento: String(est.documento),
        boleta: String(est.boleta),
        telefono: est.telefono ? String(est.telefono) : null,
        programaId: Number(est.programaId),
        semestreId: Number(est.semestreId),
        grupoId: Number(est.grupoId)
      });
    }

    if (validos.length === 0) {
      return NextResponse.json({ success: false, insertados: 0, errores });
    }

    const result = await prisma.estudiante.createMany({
      data: validos,
      skipDuplicates: true, // Ignorar duplicados por si se corre 2 veces
    });

    return NextResponse.json({ 
      success: true, 
      insertados: result.count, 
      omitidos: validos.length - result.count,
      errores 
    });
  } catch (error) {
    console.error('Error en carga masiva:', error);
    return NextResponse.json({ error: 'Error interno del servidor al insertar. Verifica las dependencias (programa, semestre, grupo).' }, { status: 500 });
  }
}
