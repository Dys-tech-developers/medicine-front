# Paleta de Colores - DYS Medicine

Paleta inspirada en una estetica de salud moderna: **violeta** como color principal
(branding, botones, iconografia) y **celestes suaves** como acento para CTAs secundarios,
badges y destacados. Transmite calma, claridad y confianza.

## Colores base

- `medical.primary` -> `#454c92` (violeta, CTAs principales)
- `medical.primaryDark` -> `#4b6a87` (hover / activo)
- `medical.secondary` -> `#e8f9f8` (fondos suaves celeste agua / hovers / bloques destacados)
- `medical.surface` -> `#F9FAFB` (fondo general de pantallas)
- `medical.card` -> `#FFFFFF` (tarjetas, modales, contenedores)
- `medical.border` -> `#cbeeed` (bordes sutiles y divisores)
- `medical.text` -> `#0F172A` (titulos y texto principal, casi negro)
- `medical.mutedText` -> `#64748B` (texto secundario / metadata)

## Acentos

- `medical.accent` -> `#73d4cd` (celeste suave, badges y CTAs secundarios)
- `medical.accentDark` -> `#97c1bf` (hover del acento)

## Estados de interfaz

- `medical.success` -> `#16A34A` (confirmaciones y estado correcto)
- `medical.warning` -> `#F59E0B` (advertencias intermedias)
- `medical.danger` -> `#DC2626` (errores y alertas criticas)

## Guia de uso rapido

- Usa `medical.primary` (violeta) para botones principales y elementos de marca (logo, iconos de navegacion, headers).
- Usa `medical.primaryDark` en hover/focus para mantener contraste.
- Usa `medical.accent` (celeste) para CTAs secundarios y destacados sin generar choque visual.
- Manten `medical.surface` y `medical.card` como base de layout para una UI limpia.
- Prioriza `medical.text` para titulos y `medical.mutedText` para descripciones.
- Reserva `medical.danger` solo para acciones destructivas o errores.

## Tokens en código

En el front, las clases reutilizables viven en `lib/medical-ui-classes.ts` (`medicalSuccessBadge`,
`medicalWarningBadge`, `MEDICAL_UI.formInput`, overlays, etc.). Preferí esos helpers antes que
`emerald-*`, `amber-*`, `slate-*` o `red-*` genéricos de Tailwind.

## Ejemplos con Tailwind

```tsx
// Boton principal (verde)
<button className="bg-medical-primary hover:bg-medical-primaryDark text-white">
  Guardar cambios
</button>

// Boton secundario / destacado (verde agua)
<button className="bg-medical-accent hover:bg-medical-accentDark text-white">
  Mis pedidos
</button>

// Seccion con fondo suave y bordes verdes
<section className="bg-medical-surface border border-medical-border text-medical-text">
  Contenido medico
</section>

// Gradiente (estilo salud)
<div className="bg-linear-to-br from-medical-primary via-medical-primaryDark to-medical-accent" />
```
