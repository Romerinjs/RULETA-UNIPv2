# Software Design Document (SDD) - Módulo de Check-in (Asistencia)

## 1. Contexto del Proyecto
Este módulo constituye la interfaz pública (`/checkin`) para que los operadores o los propios estudiantes registren la asistencia física el día del evento. Consiste en un sistema de registro ágil y de alta velocidad, optimizado para tablets y teléfonos móviles de los operadores, y diseñado bajo la identidad visual de **UNIPUTUMAYO** con una paleta dominada por el color **Verde Naturaleza (`#80BF1F`)** para diferenciarlo semánticamente del proceso de activación.

El flujo de check-in valida obligatoriamente que el estudiante haya completado previamente la **Etapa 2 (Activación de teléfono)** en `/activar`. Si un estudiante no se ha registrado previamente, el sistema le impide el ingreso físico y proporciona un acceso rápido para solucionar la activación en tiempo real.

---

## 2. Reglas Estrictas del Formulario & Validaciones

El formulario opera con un único campo activo y un panel informativo de confirmación:

1. **Código de Boleta (Entrada Activa):**
   - Campo numérico de **exactamente 4 caracteres** (`maxLength={4}`).
   - Al completar los 4 dígitos, el cliente dispara automáticamente el proceso de búsqueda asíncrona.

2. **Panel de Confirmación de Datos (Solo Lectura - Pre-check):**
   - Una vez validada la boleta, se presenta un panel con los campos: `Nombre Completo`, `Documento de Identidad`, `Programa Académico`, `Semestre` y `Grupo`.
   - Todos los campos se muestran bloqueados en modo lectura (`readOnly`).
   - El operador del evento debe realizar un cotejo visual y presionar el botón **"Registrar Asistencia"** para confirmar.

3. **Restricción de Estado Obligatoria (Pre-requisito):**
   - **Teléfono requerido (Hot-Activation Inline):** Si la boleta consultada tiene `telefono === null`, el sistema activa el modo de **Activación Inline** en caliente. Despliega un campo de celular debajo del panel de confirmación (con validación de 10 dígitos que inician con `3`). El botón cambia a **"Activar y Confirmar Asistencia"** para resolver el pre-registro y la asistencia de forma atómica y sin redireccionar al operador.
   - **Asistencia ya registrada:** Si la boleta ya tiene `asistencia === true`, el sistema bloquea el flujo principal y dispara un modal ámbar/amarillo que advierte que la asistencia del estudiante ya fue procesada, permitiendo limpiar el formulario para la siguiente boleta.

---

## 3. Especificación del Flujo de Datos

```
[Operador/Estudiante] -> Digita Boleta (4 dígitos) -> GET /api/estudiantes/[boleta]
                                                             |
[Operador/Estudiante] <- Llena panel de confirmación (200 OK) + Verifica Activación
       |
       +---> Si telefono == null  --> Despliega Input Celular + Botón "Activar y Confirmar Asistencia"
       +---> Si asistencia == true --> Bloquea + Modal Ámbar "Ya Registrado"
       +---> Si telefono != null & asistencia == false --> Habilita botón "Registrar Asistencia"
       |
[Operador/Estudiante] -> Clic botón activo -> Ejecuta en cascada (POST activar si es requerido, luego POST checkin)
                                                                    |
[Backend] <--- Recibe { boleta } <----------------------------------+
    |
    +--> Valida existencia de boleta
    +--> Valida que esté activada (estudiante.telefono !== null)
    +--> prisma.estudiante.update({ asistencia: true })
    |
[Operador/Estudiante] <--- Retorna éxito <-------------------------- 200 OK
       |
[Pantalla] ----> Muestra Modal Premium Verde "Asistencia Registrada"
```

### 3.1. Búsqueda y Precarga de Asistencia (`GET /api/estudiantes/[boleta]`)
- **Controlador:** `app/api/estudiantes/[boleta]/route.ts`
- **Uso:** Disparado al completarse los 4 dígitos de la boleta en el frontend.
- **Acciones y Relaciones Expandidas:** 
  Para este módulo, el endpoint de consulta se expandió para retornar mediante `select` las relaciones institucionales del estudiante: `programa.nombre`, `semestre.numero` y `grupo.nombre`. Esto le da al operador la total certeza de que los datos de facultad y grupo académico coinciden exactamente con la planilla de control física.
- **Optimización de Rendimiento por Índice Único:**
  Tanto la consulta como la confirmación física se resuelven mediante el índice `@unique` de `boleta` en la base de datos PostgreSQL utilizando `findUnique`. Esto evita escaneos secuenciales y asegura un tiempo de respuesta de **menos de 1 ms**, vital para evitar retrasos en las colas de acceso del evento en vivo.

### 3.2. Confirmación de Check-in (`POST /api/estudiantes/checkin`)
- **Controlador:** `app/api/estudiantes/checkin/route.ts`
- **Payload:** `{ boleta }` (No acepta ni procesa `telefono` para garantizar que la activación es un prerrequisito ya resuelto en la etapa anterior).
- **Acción en Base de Datos:**
  - **Uso de Índice para Actualización:** Ejecuta un `prisma.estudiante.update` indexado en `where: { boleta }`.
  - **Cambio de Estado:** Cambia permanentemente `asistencia: true`. Los campos `telefono` y `ganador` no se tocan (garantizando el estado `ganador: false` hasta la ejecución del módulo de ruleta).
  - **Respuestas:**
    - `200 OK` (Nuevo check-in exitoso): `{ success: true, estudiante: { nombre, programa, ... } }`.
    - `200 OK` (Ya registrado): `{ success: true, yaRegistrado: true, estudiante }`. Permite al frontend reaccionar desplegando el modal informativo ámbar en lugar de un error genérico.
    - `428 Precondition Required`: Si el estudiante no tiene teléfono (`telefono === null`), retornando error claro redirigiendo a activación.
    - `404 Not Found`: Si la boleta es inexistente.

---

## 4. Diseño, Estética e Interacciones Modernas

1. **Alineación con el Sistema de Diseño (Verde Dominante):**
   - **Color Semántico Principal:** Verde Naturaleza (`#80BF1F`), que representa la Amazonía y los procesos de campo/bienestar. Se aplica en el botón principal de confirmación, los badges interactivos del evento en vivo, y el modal de éxito.
   - **Tipografía:** Encabezados en `Raleway` de alto impacto y fuentes monoespaciadas para la boleta y el documento, lo cual facilita la rápida lectura del operador en pantallas portátiles.
   - **Badge de Status:** Incorpora un chip superior con luz pulsante en verde: `EVENTO EN VIVO`.

2. **UI Adaptativa Mobile-First:**
   - La pantalla está totalmente optimizada para pulgares y visualización en tabletas de los operadores que sostienen el dispositivo con una mano mientras verificar la fila.
   - Elementos interactivos con un target táctil mínimo de `48px` para evitar clics accidentales.

3. **Modals Premium Multi-Estado (Cero Dependencias):**
   - **Éxito (Verde #80BF1F):** Checkmark animado en SVG puro que simula un trazo dinámico al registrarse, seguido de una tarjeta con el resumen académico del estudiante.
   - **Duplicado (Ámbar #F5A51D):** Icono de advertencia en color amarillo-naranja que le indica inmediatamente al operador que el estudiante ya hizo el ingreso físico, evitando fraude o dobles registros.
   - **Activación Integrada (Inline):** Evita la necesidad de enlaces rápidos externos al integrar completamente el campo de teléfono en el pre-check del check-in, resolviendo ambas etapas en una sola pantalla.

---

## 5. Planes de Verificación

- **Construcción y Tipado:** Garantizar la ausencia de errores estáticos mediante la compilación del bundle final (`npm run build`).
- **Casos de Prueba Manuales:**
  1. Ingreso de boleta que no existe -> Mensaje rojo descriptivo "Boleta no encontrada".
  2. Ingreso de boleta que existe pero no está activada -> Banner ámbar de "Activación Pendiente" y campo "Celular de Activación" habilitado inline.
  3. Ingreso de teléfono válido en modo inline -> Presiona "Activar y Confirmar Asistencia", ejecuta cascada, muestra modal de éxito animado verde con los nuevos datos.
  4. Segundo ingreso de la misma boleta exitosa -> Modal de advertencia ámbar informando "Asistencia ya registrada".
