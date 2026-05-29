# Software Design Document (SDD) - Módulo de Carga Masiva (CSV)

## 1. Contexto del Proyecto
Este módulo permite a los administradores cargar masivamente el listado de estudiantes elegibles para el evento institucional a través de un archivo CSV. La carga se realiza desde el Dashboard de Administración (`/admin/dashboard`) y alimenta la base de datos principal para que los estudiantes puedan hacer el check-in (activación) y participar en el sorteo en vivo.

## 2. Reglas Estrictas de Arquitectura (Directivas para la IA)
- **Procesamiento en Cliente:** El archivo CSV NO debe ser enviado crudo (como `multipart/form-data`) al servidor. Se utiliza `papaparse` en el frontend para leer el archivo localmente, transformarlo a un array JSON estructurado, y enviarlo en un solo bloque.
- **Operación en Bloque (Bulk):** El backend debe utilizar exclusivamente `prisma.estudiante.createMany` con la bandera `skipDuplicates: true` para evitar múltiples iteraciones y peticiones individuales, reduciendo la sobrecarga de la base de datos.
- **Relaciones Directas por ID:** Para maximizar la velocidad de inserción y evitar búsquedas costosas de cruce de datos (`findUnique`), el CSV debe contener directamente los IDs foráneos (`programaId`, `semestreId`, `grupoId`), y no sus nombres en texto.
- **Tolerancia a Fallos por Fila:** Si una fila tiene errores de consistencia (ej. le falta un campo o la boleta no tiene 4 dígitos), el backend debe aislarla, omitir esa fila específica, y continuar insertando el resto del lote válido.

## 3. Especificación del Archivo CSV

El archivo `.csv` debe estar separado por comas y contener una cabecera exacta en la primera línea. Las columnas obligatorias (sensibles a mayúsculas/minúsculas) son:

| Columna      | Tipo       | Descripción / Restricciones                                  |
|--------------|------------|--------------------------------------------------------------|
| `nombre`     | String     | Nombre completo del estudiante.                              |
| `documento`  | String     | Documento de identidad (Marcado como `@unique` en DB).       |
| `boleta`     | String     | Número de boleta de **exactamente 4 caracteres** (`@unique`).|
| `telefono`   | String?    | (Opcional) Número de contacto. Puede ir vacío al cargar.     |
| `programaId` | Entero     | ID correspondiente al Programa en la DB.                     |
| `semestreId` | Entero     | ID correspondiente al Semestre en la DB.                     |
| `grupoId`    | Entero     | ID correspondiente al Grupo en la DB.                        |

**Ejemplo de formato válido:**
```csv
nombre,documento,boleta,telefono,programaId,semestreId,grupoId
Juan Perez,100100100,A1B2,,1,3,2
Maria Lopez,200200200,X9Y8,3001234567,2,1,1
```

## 4. Especificación del Flujo de Datos

### 4.1. Frontend (`app/admin/dashboard/csv-upload.tsx`)
1. **Lectura:** El administrador selecciona un archivo `.csv` mediante un input oculto.
2. **Parseo y Limpieza:** `Papa.parse` convierte el archivo a un array JSON, omitiendo automáticamente líneas vacías (`skipEmptyLines: true`).
3. **Envío HTTP:** Se realiza un método `POST` a `/api/admin/estudiantes/bulk` enviando el payload serializado `{ "estudiantes": [...] }`.
4. **Feedback Visual:** Se utiliza la librería `react-toastify` para notificar al usuario:
   - **Verde (Success):** Si la carga se completó, informando total de registros *insertados* vs *omitidos*.
   - **Amarillo/Naranja (Warn):** Si hubo filas corruptas, instando a revisar la consola.
   - **Rojo (Error):** En caso de caídas de red o falla severa de servidor.
5. **Reactividad:** A través de un callback (`onUploadSuccess`), se fuerza la recarga (re-fetch) de la tabla de lista de estudiantes adyacente (`student-list.tsx`).

### 4.2. Backend (`app/api/admin/estudiantes/bulk/route.ts`)
1. **Autenticación:** Todo el bloque está protegido con una validación de sesión real (`await auth()`).
2. **Validación en Memoria (Por Fila):** Antes de tocar la base de datos, se itera el array filtrando las filas inválidas:
   - Asegurando que todos los campos requeridos tengan un valor.
   - Forzando cast de datos (`Number()` para los IDs relacionales, `String()` para textos).
   - Comprobando rígidamente la regla de negocio: `boleta.length === 4`.
3. **Inserción Eficiente (DB):** Ejecuta `createMany` en Prisma. Si encuentra registros con boletas o documentos pre-existentes, la opción `skipDuplicates: true` previene la caída y simplemente los ignora.
4. **Respuesta Estructurada API:** Retorna de forma limpia y transparente las estadísticas de la transacción para informar al administrador:
   ```json
   {
     "success": true,
     "insertados": 150,
     "omitidos": 2,
     "errores": [
       { "fila": 45, "mensaje": "Faltan campos obligatorios" },
       { "fila": 112, "mensaje": "La boleta 12 no es de 4 caracteres." }
     ]
   }
   ```
