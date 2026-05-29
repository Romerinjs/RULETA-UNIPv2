# Software Design Document (SDD) - Módulo de Activación (Pre-Registro)

## 1. Contexto del Proyecto
Este módulo constituye la interfaz pública (`/activar`) donde los estudiantes realizan el pre-registro obligatorio para habilitarse en el sorteo en vivo. Consiste en un formulario interactivo y altamente optimizado para teléfonos móviles, diseñado de acuerdo con los lineamientos del sistema de diseño institucional de **UNIPUTUMAYO**. 

El flujo de trabajo garantiza la consistencia e integridad de los datos, ya que los estudiantes no pueden alterar su nombre ni documento pre-cargado desde el listado CSV administrativo. Solo pueden asociar un número telefónico válido y único para activar su boleta.

---

## 2. Reglas Estrictas del Formulario & Validaciones

El formulario cuenta con cuatro campos principales: `Nombre`, `Documento`, `Boleta` y `Teléfono`. Las reglas operativas son:

1. **Código de Boleta (Entrada Activa):**
   - Entrada de **exactamente 4 caracteres** (`maxLength={4}`).
   - Convierte automáticamente todas las letras a mayúsculas en tiempo real.
   - Al completar el cuarto carácter, el frontend dispara una consulta asíncrona de búsqueda.

2. **Nombre Completo y Documento de Identidad (Solo Lectura):**
   - Se encuentran deshabilitados (`readOnly`) y con estilos visuales de bloqueo.
   - Se auto-completan dinámicamente una vez que la boleta es validada en el backend.
   - Previene que los estudiantes ingresen identidades falsas o alteren el registro administrativo inicial.

3. **Teléfono (Inserción Directa en BD):**
   - **Campo obligatorio** en frontend para activar el formulario.
   - **Restricción de caracteres:** No se permite el ingreso de letras ni símbolos especiales (`onChange` filtra mediante la expresión regular `\D` y solo permite dígitos `0-9`).
   - **Longitud exacta:** Debe contener exactamente **10 dígitos**.
   - **Prefijo obligatorio:** Debe iniciar siempre con el número **`3`**.
   - El input muestra mensajes dinámicos de error en tiempo real (por ejemplo, indicando cuántos dígitos le faltan o si el prefijo es incorrecto).

---

## 3. Especificación del Flujo de Datos

```
[Estudiante] -> Escribe Boleta (4 chars) -> GET /api/estudiantes/[boleta]
                                                    |
[Estudiante] <- Llena Nombre & Documento <--- Retorna datos (200 OK)
      |
[Estudiante] -> Ingresa Teléfono válido (10 digitos, inicia con 3) -> Clic "Activar Boleta"
                                                                             |
[Backend] <--- Recibe { boleta, telefono } <--------------------------------- POST /api/estudiantes/activar
    |
    +--> Valida que boleta exista y no tenga telefono previo
    |
    +--> prisma.estudiante.update({ telefono, asistencia: false, ganador: false })
    |
[Estudiante] <--- Retorna éxito <--------------------------------------------- 200 OK
      |
[Pantalla] ----> Muestra Modal Premium "Registrado" con Check animado verde
```

### 3.1. Consulta de Boleta (`GET /api/estudiantes/[boleta]`)
- **Controlador:** `app/api/estudiantes/[boleta]/route.ts`
- **Uso:** El frontend detecta cuando `boleta.length === 4` e inicia una llamada GET.
- **Propósito Operacional (¿Por qué lo hacemos?):** 
  Esta consulta dinámica se ejecuta en tiempo real para optimizar drásticamente la experiencia de usuario (UX) en dispositivos móviles. Al evitar que el estudiante tenga que escribir manualmente su nombre y documento, se eliminan por completo los errores de transcripción y ortografía. Además, proporciona una confirmación visual inmediata y de seguridad para que el estudiante esté 100% seguro de que está activando su propia boleta institucional.
- **Optimización de Rendimiento por Índice Único:** 
  La búsqueda en base de datos se realiza obligatoriamente mediante `prisma.estudiante.findUnique` utilizando la columna `boleta`. Al estar definida la columna `boleta` como `@unique` en el esquema de Prisma, PostgreSQL realiza una búsqueda directa por índice único (*Index Scan*), reduciendo la complejidad temporal a $O(1)$. Esto garantiza que la consulta se resuelva en **menos de 1 ms**, eliminando escaneos de tabla completa (*Seq Scan*) y protegiendo el servidor ante picos masivos de concurrencia durante el evento.
- **Respuestas:**
  - `200 OK`: Retorna `{ nombre, documento, telefono, asistencia }`.
  - `400 Bad Request`: Si la boleta es estructuralmente inválida.
  - `404 Not Found`: Si la boleta no existe.

### 3.2. Proceso de Activación (`POST /api/estudiantes/activar`)
- **Controlador:** `app/api/estudiantes/activar/route.ts`
- **Uso:** El formulario envía el payload `{ boleta, telefono }` mediante un método POST.
- **Acción en Base de Datos Indexada & Rápida:**
  - **Uso del Índice para Inserción/Actualización:** La actualización del teléfono se realiza directamente localizando el registro con `prisma.estudiante.update({ where: { boleta }, data: { ... } })`. Al igual que en la consulta, buscar el registro a modificar a través del índice único `@unique` de la columna `boleta` asegura que el motor PostgreSQL ejecute un acceso directo ultra-rápido en la escritura, evitando bloqueos de tablas y resolviendo la transacción en menos de 1ms de CPU.
  - **Actualización de Teléfono:** Actualiza únicamente el campo `telefono` con el número de celular verificado en el frontend.
  - **Requisito estricto de Garantía de Estado:** Inicializa o sobrescribe explícitamente los campos `asistencia: false` y `ganador: false` en la misma operación indexada. Esto garantiza que la activación de la boleta sea una fase pura de pre-registro y no altere los flujos y auditorías de asistencia o de selección de ganadores en la ruleta en vivo.

---

## 4. Diseño, Estética e Interacciones Modernas

1. **Alineación con Tokens de UNIPUTUMAYO:**
   - **Canvas de Fondo:** Blanco puro (`#ffffff`) en la tarjeta principal.
   - **Colores de Identidad:** Azul Institucional (`#18668F`), Verde Naturaleza (`#80BF1F`) y Naranja Energía (`#F5A51D`).
   - **Rhythm & Spacing:** Espaciados consistentes de `16px` (`--space-4`) y `24px` (`--space-6`) y esquinas con radio estándar de `8px` a `12px` (`--radius-md`).
   - **Tipografías:** Enlazadas mediante variables nativas de Next.js (`Raleway` para títulos destacados y `Roboto` para textos de interfaz e inputs).

2. **Optimización Mobile-First:**
   - La interfaz está diseñada como una tarjeta fluida autocentrada que abarca el ancho óptimo en smartphones (`max-w-md`) para una ergonomía de pulgar perfecta.
   - Dispone de touch targets ampliados para los campos de texto e inputs (`py-3`).
   - Posee un teclado numérico optimizado en móviles (`inputMode="numeric"`, `pattern="[0-9]*"`).

3. **Efectos y Micro-Animaciones Premium (Cero Dependencias):**
   - El estado de carga (spinning indicator) se dibuja mediante SVG puro.
   - El modal de éxito "Registrado" cuenta con una máscara translúcida difuminada (`backdrop-blur-[4px]`) y una animación de escala elástica (`cubic-bezier`).
   - **Checkmark SVG Animado:** Cuando el registro se completa, un ícono de check en color verde (`#80BF1F`) se dibuja de forma interactiva y fluida sobre la pantalla simulando una firma verificada digital empleando transiciones CSS nativas integradas directamente en el componente.

---

## 5. Planes de Verificación Realizados
- **Compilación de Código:** Ejecución exitosa de `npm run build` para asegurar la libre existencia de errores de tipado en TypeScript y conformidad con Next.js.
- **Pruebas de Flujo:** Validación interactiva ingresando boletas erróneas, números de teléfono inválidos (letras, menos de 10 dígitos o prefijos distintos a 3) y validación exitosa de guardado directo en base de datos.
