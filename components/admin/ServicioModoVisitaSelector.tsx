"use client";

import type { ServicioModoVisitaFormValue } from "@/lib/servicios-display";

const OPTIONS: {
  value: ServicioModoVisitaFormValue;
  label: string;
  description: string;
}[] = [
  {
    value: "registro_unico",
    label: "Registro en un paso",
    description: "El prestador escanea el QR y guarda la visita con duración automática.",
  },
  {
    value: "control_horario",
    label: "Control horario",
    description: "El prestador inicia y finaliza la visita por separado.",
  },
  {
    value: "relevamiento",
    label: "Relevamiento",
    description:
      "Cobertura continua con relevamiento por QR. El prestador en turno no finaliza solo; otro prestador toma el tramo al escanear.",
  },
];

type Props = {
  name: string;
  value: ServicioModoVisitaFormValue;
  onChange: (value: ServicioModoVisitaFormValue) => void;
  disabled?: boolean;
};

export function ServicioModoVisitaSelector({ name, value, onChange, disabled = false }: Props) {
  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="text-sm font-medium text-medical-text">Modo de visita</legend>
      <p className="text-xs text-medical-mutedText">
        Elegí una opción. Control horario y relevamiento son excluyentes.
      </p>
      <div className="space-y-2">
        {OPTIONS.map((option) => {
          const id = `${name}-${option.value}`;
          const checked = value === option.value;
          return (
            <label
              key={option.value}
              htmlFor={id}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 transition ${
                checked
                  ? "border-medical-primary/40 bg-medical-secondary/50"
                  : "border-medical-border bg-white hover:bg-medical-surface/60"
              } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <input
                id={id}
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                disabled={disabled}
                className="mt-1 h-4 w-4 shrink-0 accent-medical-primary"
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-medical-text">{option.label}</span>
                <span className="mt-0.5 block text-xs text-medical-mutedText">{option.description}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
