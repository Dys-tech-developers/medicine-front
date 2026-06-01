# Arquitectura simple

Objetivo: mantener una estructura basica y facil de entender para una app frontend con Next.js.

## Estructura recomendada

```txt
app/          # rutas y paginas (App Router)
components/   # componentes reutilizables de UI
lib/          # helpers, tipos simples y servicios
public/       # assets estaticos
docs/         # documentacion corta del proyecto
```

## Reglas cortas

1. Si un componente se usa en una sola pagina, puede vivir junto a esa pagina.
2. Si se reutiliza en varias pantallas, va a `components/`.
3. Logica utilitaria y acceso a localStorage/API va a `lib/`.
4. Crear carpetas nuevas solo cuando realmente hagan falta.
