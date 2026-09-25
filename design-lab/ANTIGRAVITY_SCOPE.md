# Antigravity · Scope estricto del Design Lab

## Rama permitida
Trabaja **únicamente** en la rama `design-lab`.

Antes de cualquier cambio:

```bash
git switch design-lab
git status
git branch --show-current
```

La salida de `git branch --show-current` debe ser exactamente:

```text
design-lab
```

## Directorio permitido
Solo puedes crear, editar, mover o eliminar archivos dentro de:

```text
design-lab/**
```

No modifiques `v2/**`, `admin/**`, `scripts/**`, `.github/**`, archivos de raíz ni ninguna parte de producción.

## Vista que debe usarse
La maqueta completa del laboratorio está en:

```text
design-lab/index.html
design-lab/styles.css
design-lab/app.js
design-lab/mock-data.js
```

La vista limpia de computadora para revisión está en:

```text
design-lab/desktop.html
```

`desktop.html` es un visor. Los cambios visuales deben hacerse en los archivos del Lab, no copiando lógica de producción.

## Aislamiento obligatorio
El Lab sigue siendo una maqueta estática:
- no conectar Supabase;
- no conectar Workers ni APIs reales;
- no usar pagos reales;
- no usar QR real;
- no usar claves, secretos ni credenciales;
- no modificar PWA, autenticación, pedidos, Wallet o reglas reales de producción.

## Comprobación antes de cada commit
Ejecuta:

```bash
git branch --show-current
git diff --name-only
git status --short
```

Si aparece cualquier archivo fuera de `design-lab/`, no lo incluyas y revierte ese cambio antes de continuar.

## Commit y push
Solo:

```bash
git add design-lab/
git commit -m "design-lab: <resumen del cambio>"
git push origin design-lab
```

Nunca hagas `git push origin main`, nunca hagas merge a `main` y nunca cambies de rama salvo que el usuario lo pida explícitamente.
