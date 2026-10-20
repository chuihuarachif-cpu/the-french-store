# Protocolo Gemini 4 Argon

> Copia del protocolo canónico de `chuihuarachif-cpu/the-french-store-privado` (`.agents/ARGON_PROTOCOL.md`, rama `design-lab`). Las menciones a `COORDINATION.md`, `TASKS.md` y `HANDOFF.md` remiten al hub `D:\Proyectos\FrenchStore\the-french-store`. Si difieren, rige la canónica.

Versión: 2026-10-20. Se aplica en todos los repositorios de French Store (tienda, Worker de pagos, French Arcade y juegos). No sustituye ni relaja ninguna regla de seguridad, de Git, de propiedad de tarea ni de handoff: si algo choca, rige la regla más restrictiva.

## 1. Qué es Argon

**Gemini 4 Argon** es un especialista externo que recibe un prompt y devuelve **solo texto** (código fuente y una explicación mínima). No es un agente del repositorio.

- No lee repositorios, no ejecuta, no compila, no crea archivos descargables y no opera servicios.
- No hace merges, pushes, despliegues ni cambios en producción.
- No es Antigravity · Gemini (assets y multimedia, ver `COORDINATION.md` §2) ni ocupa un puesto en la cadena de relevo por cuota.

Claude Code y Codex siguen siendo responsables de sus proyectos: integración, pruebas, commits, repositorios y entregas.

## 2. Cuándo pedir ayuda a Argon

Solo si se cumplen **las cinco** condiciones:

1. El problema es difícil de verdad (mucha lógica, algoritmos avanzados, cálculo, optimización o diseño técnico) y Argon puede aportar una solución sustancial.
2. Se resuelve entregando código fuente como texto.
3. La respuesta pedida tiene menos de 1.000 líneas; mejor, muchas menos.
4. No requiere crear archivos descargables, ejecutar, compilar, acceder a repositorios ni operar servicios externos.
5. Se puede dar contexto técnico suficiente **sin** credenciales, secretos ni datos sensibles.

No se delega una tarea sencilla. No se detiene el desarrollo si el agente responsable puede resolverlo con eficiencia. No se pide la misma tarea a varios agentes a la vez sin necesidad.

## 3. Qué nunca va en un prompt para Argon

- Claves, tokens, `service_role`, secretos de Worker o de proveedores, `.env`, `wrangler` secrets, IDs de cuenta privados.
- Datos de clientes: correos, IDs de juego de pedidos, saldos, referencias de pago, registros de BISA.
- Costos de proveedor, márgenes internos, fórmulas de revendedores u operaciones protegidas (ver `AGENTS.md`).
- Código completo de módulos de seguridad cuando basta con su interfaz.

Sustituir por datos ficticios con la misma forma. En autenticación, pagos, Wallet y Rewards la autoridad sigue en el servidor (Supabase/RLS y Worker): Argon no diseña controles que trasladen esa autoridad al navegador.

## 4. Procedimiento de delegación

1. Detener solo la parte de programación que necesita ayuda; el resto continúa.
2. Identificar archivos y funciones afectados.
3. Preparar un prompt autosuficiente con: lenguaje y versión (motor, runtime, navegador objetivo), entradas, salidas, restricciones (rendimiento, memoria, móvil, sin dependencias nuevas salvo que se indiquen), interfaces existentes que debe respetar (firmas exactas) y criterios de aceptación comprobables.
4. Pedir exclusivamente código ejecutable o integrable, con explicación mínima.
5. Limitar la entrega a menos de 1.000 líneas. Si es mayor, dividir en módulos independientes y pedir **uno por turno**.
6. Mostrar al propietario el aviso de la sección 5 y esperar. **Nunca** afirmar que Argon ejecutó algo ni inventar su respuesta.

## 5. Aviso al propietario

```
🧠 TAREA PARA GEMINI 4 ARGON
Proyecto:
[Nombre]
Problema difícil:
[Descripción]
Archivos afectados:
[Rutas]
Por qué conviene utilizar Argon:
[Motivo técnico]
PROMPT LISTO PARA COPIAR A ARGON:
[Instrucción precisa y autosuficiente]
ESTADO: Esperando el código de Argon.
```

Si la sesión termina mientras se espera, registrar en `HANDOFF.md`: tarea, archivos, prompt enviado (o su ubicación) y estado «Esperando Argon».

## 6. Al recibir la respuesta

El código de Argon es **código externo**: nunca se integra sin revisión.

1. Revisar el código completo.
2. Comprobar compatibilidad con el proyecto real (versiones, APIs que existan de verdad, dependencias).
3. Corregir errores, dependencias inexistentes y vulnerabilidades.
4. Adaptarlo a los contratos e interfaces existentes.
5. Integrarlo en los archivos correspondientes.
6. Ejecutar las pruebas del área (y añadir las que falten para la lógica nueva).
7. Hacer commit en la rama correcta de la tarea, con el flujo normal de revisión.
8. Documentar el origen: en el mensaje del commit, una línea `Origen: Gemini 4 Argon (revisado e integrado por <agente>)` que indique qué partes provienen de Argon, y lo mismo en el handoff o en el PR.

Si la solución es incorrecta, el agente responsable la corrige directamente o pide una versión nueva con el fallo concreto.

## 7. Proyectos prioritarios

- **Nexa Sudoku:** lógica, anuncios, validaciones y rendimiento.
- **Prism Realm:** algoritmos, geometría, shaders, niveles y optimización 3D.
- **Velocity Rift:** físicas, IA de vehículos, circuitos y rendimiento.
- **Apex Multiverse:** sistemas 3D, streaming, LOD y optimizaciones.
- **THE FRENCH STORE:** arquitectura compleja, autenticación y lógica frontend.
- **Backend/Worker:** algoritmos y validaciones complejas, sin compartir secretos.
