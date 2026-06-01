"use client";

import { CheckCircle2, MapPin, Phone } from "lucide-react";
import type { PrestadorScannedPatient } from "@/lib/prestador-visitas";

const SEXO_LABELS: Record<string, string> = {
  M: "Masculino",
  F: "Femenino",
  X: "Otro / no binario",
};

type Props = {
  patient: PrestadorScannedPatient;
};

export function PrestadorPatientCard({ patient }: Props) {
  const initials = patient.fullName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <section className="mb-5 overflow-hidden rounded-2xl border border-medical-primary/30 bg-medical-card shadow-sm shadow-medical-primary/10">
      <div className="flex items-center gap-2 border-b border-medical-primary/20 bg-medical-primary/8 px-4 py-2.5">
        <CheckCircle2 className="h-4 w-4 text-medical-primary" />
        <p className="text-sm font-semibold text-medical-primaryDark">Paciente identificado</p>
      </div>

      <div className="p-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-medical-primary text-lg font-bold text-white">
            {initials}
          </div>
          <div>
            <p className="font-semibold text-medical-text">{patient.fullName}</p>
            <p className="text-xs text-medical-mutedText">DNI {patient.document}</p>
          </div>
        </div>

        <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div className="rounded-lg border border-medical-border bg-medical-surface px-3 py-2">
            <dt className="text-[10px] font-medium uppercase tracking-wide text-medical-mutedText">QR</dt>
            <dd className="mt-0.5 font-semibold text-medical-text">{patient.codigoQr}</dd>
          </div>
          <div className="rounded-lg border border-medical-border bg-medical-surface px-3 py-2">
            <dt className="text-[10px] font-medium uppercase tracking-wide text-medical-mutedText">Edad</dt>
            <dd className="mt-0.5 font-semibold text-medical-text">{patient.age} años</dd>
          </div>
          <div className="rounded-lg border border-medical-border bg-medical-surface px-3 py-2">
            <dt className="text-[10px] font-medium uppercase tracking-wide text-medical-mutedText">Sexo</dt>
            <dd className="mt-0.5 font-semibold text-medical-text">
              {SEXO_LABELS[patient.sexo] ?? patient.sexo}
            </dd>
          </div>
          <div className="rounded-lg border border-medical-border bg-medical-surface px-3 py-2">
            <dt className="text-[10px] font-medium uppercase tracking-wide text-medical-mutedText">Cobertura</dt>
            <dd className="mt-0.5 font-semibold text-medical-text">{patient.insurance}</dd>
          </div>
          {patient.telefono ? (
            <div className="col-span-1 flex gap-2 rounded-lg border border-medical-border bg-medical-surface px-3 py-2 sm:col-span-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-medical-mutedText" />
              <div>
                <dt className="text-[10px] font-medium uppercase tracking-wide text-medical-mutedText">
                  Teléfono
                </dt>
                <dd className="mt-0.5 font-semibold text-medical-text">{patient.telefono}</dd>
              </div>
            </div>
          ) : null}
          {patient.direccion ? (
            <div className="col-span-1 flex gap-2 rounded-lg border border-medical-border bg-medical-surface px-3 py-2 sm:col-span-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-medical-mutedText" />
              <div>
                <dt className="text-[10px] font-medium uppercase tracking-wide text-medical-mutedText">
                  Domicilio
                </dt>
                <dd className="mt-0.5 font-semibold text-medical-text">{patient.direccion}</dd>
              </div>
            </div>
          ) : null}
        </dl>
      </div>
    </section>
  );
}
