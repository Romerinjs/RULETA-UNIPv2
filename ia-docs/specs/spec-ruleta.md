# Software Design Document (SDD) - Módulo de Ruleta (Sorteo Jackpot)

## 1. Contexto del Proyecto
Este módulo constituye la fase culminante (**Etapa 4 - Ruleta en Vivo**) del pipeline del evento de **DÍA DEL ESTUDIANTE** de **UNIPUTUMAYO**. Es una pantalla interactiva diseñada para proyectarse en pantalla gigante, accesible de manera exclusiva para administradores autenticados bajo la ruta protegida `/admin/ruleta`.

El sistema emula una máquina tragamonedas (Jackpot / Slot Machine) con cuatro bloques numéricos independientes que giran en vertical. Permite elegir un ganador aleatorio y único entre la base de datos de estudiantes habilitados que cumplen estrictamente las condiciones de participación.

---

## 2. Reglas del Sorteo & Condiciones de Elegibilidad

Para que un estudiante sea un candidato elegible en la ruleta, debe satisfacer las siguientes condiciones concurrentes en base de datos:
1.  **Registro de Asistencia Obligatorio:** El campo `asistencia` debe ser estrictamente `true`. (Marcado en el check-in físico de la Etapa 3).
2.  **No Haber Ganado Previamente:** El campo `ganador` debe ser estrictamente `false`. (Evita duplicidad de premios, asegurando que cada estudiante pueda ganar a lo sumo una vez).
3.  **Tener Boleta Activada:** El campo `telefono` debe ser diferente de `null` (`telefono: { not: null }`), garantizando que completó satisfactoriamente el pre-registro de la Etapa 2.

---

## 3. Especificación del Flujo de Datos & Animación Jackpot

```
[Administrador] ───► Clic en Palanca 3D / Botón "Girar" ───► POST /api/admin/ruleta/sortear
                                                                       │
[Frontend]  ◄─── Retorna { success, ganador: { boleta: "1005", ... } } ◄┘ (Respuesta inmediata)
    │
    ├──► Inicia giros rápidos infinitos en las 4 cintas de números (0-9)
    ├──► Lámparas inferiores cambian a "⏳ GIRANDO" (ámbar parpadeante)
    │
    ├──► [4.0 segundos]: Coge cinta 1 (Miles) y desacelera elásticamente en '1'. Luz 1 -> "✓ LISTO" (verde)
    ├──► [5.0 segundos]: Coge cinta 2 (Centenas) y desacelera elásticamente en '0'. Luz 2 -> "✓ LISTO" (verde)
    ├──► [6.0 segundos]: Coge cinta 3 (Decenas) y desacelera elásticamente en '0'. Luz 3 -> "✓ LISTO" (verde)
    ├──► [7.0 segundos]: Coge cinta 4 (Unidades) y desacelera elásticamente en '5'. Luz 4 -> "✓ LISTO" (verde)
    │
    ▼ (Finalización de giros)
[Pantalla Gigante] ──► Revela en óvalo elegante: "¡ESTUDIANTE GANADOR! ROMER ALBERTO - Ingeniería (8º Semestre)"
```

### 3.1. Sorteo Seguro en Memoria (`POST /api/admin/ruleta/sortear`)
- **Controlador:** `app/api/admin/ruleta/sortear/route.ts`
- **Seguridad:** Custodiado por `auth()` de NextAuth. Cualquier intento no autenticado es rechazado con `401 Unauthorized`.
- **Rendimiento e Índices del Sorteo (Menos de 1 ms):**
  - **Uso del Índice Compuesto:** La búsqueda de candidatos utiliza la cláusula `where: { asistencia: true, ganador: false, telefono: { not: null } }`. Al contar con el índice compuesto `@@index([asistencia, ganador])` definido en `schema.prisma`, PostgreSQL localiza directamente la subtabla de candidatos filtrados en tiempo récord sin realizar costosos escaneos de tabla completa.
  - **Sorteo Limpio en Memoria RAM:** Para evitar el anti-patrón de ordenamiento aleatorio directo en base de datos (`ORDER BY RAND()`) que colapsa la CPU en VPS, la API solo descarga los `id` de los candidatos elegibles (`select: { id: true }`). La selección del ganador se realiza en la memoria del servidor de Node.js eligiendo un índice aleatorio uniforme mediante `Math.floor(Math.random() * candidatos.length)`.
  - **Actualización Indexada:** Una vez obtenido el ID del ganador, se actualiza el registro con `prisma.estudiante.update({ where: { id: ganadorId }, data: { ganador: true } })`, bloqueando atómicamente al estudiante para futuros sorteos.

---

## 4. Diseño, Estética e Interacciones Modernas

1. **Estructura del Jackpot Visual (Alineación con Design.md):**
   - **Gabinete de Números:** 4 visores verticales con fondo gris sutil (`bg-subtle`) y esquinas redondeadas. Un marco dorado central (`border-orange-energy`) delimita la zona de selección, mostrando el número activo con máximo peso y contraste (`text-[56px] font-black`), mientras los números superior e inferior se muestran con escala reducida y baja opacidad (`text-ink-secondary/35 scale-90`).
   - **Cintas de Números Fluyentes:** La secuencia del `0` al `9` se repite 8 veces verticalmente. La animación del giro se realiza mediante la propiedad GPU-accelerated `transform: translateY` utilizando la desaceleración elástica `cubic-bezier(0.12, 0.8, 0.3, 1)` para que los números den un rebote natural al detenerse.

2. **Mecánica de la Palanca del Jackpot:**
   - La palanca de jackpot en el lateral derecho consta de una ranura de acero y una varilla con una bola roja brillante en la punta.
   - Al hacer clic, la varilla se desplaza físicamente hacia abajo un 40% y la bola se traslada en vertical con transiciones elásticas rápidas (`leverPulled`), regresando a su posición inicial a los 500 ms tras activar el sorteo.

3. **Lámparas Inferiores e Indicadores:**
   - Cada bloque posee una lámpara con status dinámico:
     - Durante el sorteo: `⏳ GIRANDO` con pulso luminoso en color ámbar.
     - Al frenar cada bloque: Cambia secuencialmente y con sonido/luz a `✓ LISTO` en color verde brillante (`text-green-nature bg-green-50 border-green-200`) e iluminación de sombra para una excelente retroalimentación.

4. **Óvalo de Ganador Elegante:**
   - Posicionado debajo de la ruleta. Se mantiene oculto durante el giro de los números para mantener la tensión y el misterio en el auditorio.
   - Al detenerse el último bloque a los 7 segundos, se expande con una animación elástica (`animate-scale-in`) y fondo verde translúcido (`bg-[#80BF1F]/10`), mostrando el nombre del estudiante con el código de boleta resaltado y sus datos de carrera y semestre en chips de alto contraste.

---

## 5. Planes de Verificación

- **Construcción y Tipado:** Garantizar la ausencia de fallos estáticos compilando el bundle final de Next.js (`npm run build`).
- **Pruebas de Sorteo Manuales:**
  1. Acceso no autorizado -> Intentar navegar a `/admin/ruleta` sin iniciar sesión debe forzar la redirección a `/admin/login`.
  2. Sorteo sin candidatos -> Mostrar banner descriptivo de error en color rojo si no existen estudiantes con asistencia cargada en la BD.
  3. Ejecución del Giro -> Tirar de la palanca, constatar la animación de giro en cascada secuencial (frenado a los 4s, 5s, 6s, 7s).
  4. Bloqueo de Ganador -> Validar que el estudiante ganador sea marcado con `ganador: true` en PostgreSQL y no pueda ser seleccionado en subsecuentes tiros de la palanca.
