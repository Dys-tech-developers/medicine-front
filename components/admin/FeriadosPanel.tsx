"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  CalendarDays,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { ApiError } from "@/lib/api/client";
import {
  createFeriadoWithApi,
  deleteFeriadoWithApi,
  listFeriadosWithApi,
  updateFeriadoWithApi,
} from "@/lib/api/feriados";
import { getApiErrorMessages } from "@/lib/api/format-api-error";
import type { CreateFeriadoBody, FeriadoDto, UpdateFeriadoBody } from "@/lib/api/types";
import {
  DEFAULT_MIN_LOADING_MS,
  delayRemaining,
} from "@/lib/loading/minimum-duration";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const inputClass =
  "h-10 w-full rounded-xl border border-medical-border bg-medical-surface/80 px-3 text-sm text-medical-text outline-none focus:border-medical-primary focus:bg-medical-card focus:ring-4 focus:ring-medical-primary/12 disabled:opacity-60";

const textareaClass =
  "min-h-[88px] w-full resize-y rounded-xl border border-medical-border bg-medical-surface/80 px-3 py-2 text-sm text-medical-text outline-none focus:border-medical-primary focus:bg-medical-card focus:ring-4 focus:ring-medical-primary/12 disabled:opacity-60";

type ActivoFilter = "all" | "active" | "inactive";

type FeriadoFormState = {
  fecha: string;
  titulo: string;
  descripcion: string;
  activo: boolean;
};

const emptyForm = (): FeriadoFormState => ({
  fecha: "",
  titulo: "",
  descripcion: "",
  activo: true,
});

function formatFechaDisplay(fecha: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return fecha;
  const [y, m, d] = fecha.split("-");
  return `${d}/${m}/${y}`;
}

function feriadoConflictMessage(err: ApiError): string {
  if (err.status === 409) {
    return (
      err.message?.trim() ||
      "Ya existe un feriado para esa fecha. Elegí otra fecha o editá el existente."
    );
  }
  return getApiErrorMessages(err).join(" ");
}

type FeriadosPanelProps = {
  accessToken: string;
  canManage: boolean;
  onNotify: (message: string, kind: "success" | "error", detail?: string) => void;
};

export function FeriadosPanel({ accessToken, canManage, onNotify }: FeriadosPanelProps) {
  const [items, setItems] = useState<FeriadoDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [activoFilter, setActivoFilter] = useState<ActivoFilter>("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FeriadoDto | null>(null);
  const [form, setForm] = useState<FeriadoFormState>(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<FeriadoDto | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setListError("");
    try {
      const data = await listFeriadosWithApi(accessToken, {
        page: 1,
        pageSize: 100,
        desde: desde || undefined,
        hasta: hasta || undefined,
        activo:
          activoFilter === "all" ? undefined : activoFilter === "active",
      });
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? getApiErrorMessages(err).join(" ")
          : "No se pudieron cargar los feriados.";
      setListError(msg);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [accessToken, desde, hasta, activoFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormError("");
    setDialogOpen(true);
  };

  const openEdit = (feriado: FeriadoDto) => {
    setEditing(feriado);
    setForm({
      fecha: feriado.fecha,
      titulo: feriado.titulo,
      descripcion: feriado.descripcion ?? "",
      activo: feriado.activo,
    });
    setFormError("");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (saving) return;
    setDialogOpen(false);
    setEditing(null);
    setFormError("");
  };

  const validateForm = (): string | null => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.fecha)) {
      return "La fecha es obligatoria (YYYY-MM-DD).";
    }
    const titulo = form.titulo.trim();
    if (!titulo) return "El título es obligatorio.";
    if (titulo.length > 200) return "El título no puede superar 200 caracteres.";
    if (form.descripcion.trim().length > 5000) {
      return "La descripción no puede superar 5000 caracteres.";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const localError = validateForm();
    if (localError) {
      setFormError(localError);
      return;
    }

    const desc = form.descripcion.trim();
    setSaving(true);
    setFormError("");
    const startedAt = Date.now();
    try {
      if (editing) {
        const body: UpdateFeriadoBody = {
          fecha: form.fecha,
          titulo: form.titulo.trim(),
          descripcion: desc ? desc : null,
          activo: form.activo,
        };
        const updated = await updateFeriadoWithApi(accessToken, editing.id, body);
        await delayRemaining(DEFAULT_MIN_LOADING_MS, startedAt);
        setItems((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
        onNotify("Feriado actualizado", "success", updated.titulo);
      } else {
        const body: CreateFeriadoBody = {
          fecha: form.fecha,
          titulo: form.titulo.trim(),
          ...(desc ? { descripcion: desc } : {}),
          activo: form.activo,
        };
        const created = await createFeriadoWithApi(accessToken, body);
        await delayRemaining(DEFAULT_MIN_LOADING_MS, startedAt);
        onNotify("Feriado creado", "success", created.titulo);
        await load();
      }
      setDialogOpen(false);
      setEditing(null);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? feriadoConflictMessage(err)
          : "No se pudo guardar el feriado.";
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActivo = async (feriado: FeriadoDto) => {
    if (!canManage) return;
    setTogglingId(feriado.id);
    try {
      const updated = await updateFeriadoWithApi(accessToken, feriado.id, {
        activo: !feriado.activo,
      });
      setItems((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      onNotify(
        updated.activo ? "Feriado activado" : "Feriado desactivado",
        "success",
        updated.titulo
      );
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? getApiErrorMessages(err).join(" ")
          : "No se pudo actualizar el estado.";
      onNotify(msg, "error");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteFeriadoWithApi(accessToken, deleteTarget.id);
      setItems((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      setTotal((t) => Math.max(0, t - 1));
      onNotify("Feriado eliminado", "success", deleteTarget.titulo);
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(
        err instanceof ApiError
          ? getApiErrorMessages(err).join(" ")
          : "No se pudo eliminar el feriado."
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Card className="border-medical-border bg-medical-card shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-medical-primary" />
              <div>
                <CardTitle className="text-base">Feriados</CardTitle>
                <CardDescription>
                  Fechas especiales activas. En feriados el cobro usa tipo día «feriado»
                  (no «no hábil»). Si el servicio no tiene tarifa feriado ni día «cualquiera»,
                  la visita ese día falla al liquidar.
                </CardDescription>
              </div>
            </div>
            {canManage ? (
              <Button
                type="button"
                onClick={openCreate}
                className="cursor-pointer bg-medical-primary text-white hover:bg-medical-primaryDark"
              >
                <Plus className="h-4 w-4" />
                Nuevo feriado
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label className="mb-1.5 block text-xs font-medium text-medical-mutedText">
                Desde
              </Label>
              <Input
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs font-medium text-medical-mutedText">
                Hasta
              </Label>
              <Input
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs font-medium text-medical-mutedText">
                Estado
              </Label>
              <Select
                value={activoFilter}
                onValueChange={(v) => setActivoFilter(v as ActivoFilter)}
              >
                <SelectTrigger className={inputClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {listError ? (
            <p className="rounded-xl border border-medical-danger/30 bg-medical-danger/10 px-3 py-2 text-sm text-medical-danger">
              {listError}
            </p>
          ) : null}

          {loading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-medical-mutedText">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando feriados…
            </div>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-sm text-medical-mutedText">
              No hay feriados con los filtros actuales.
            </p>
          ) : (
            <>
              <p className="text-xs text-medical-mutedText">
                {total} feriado{total === 1 ? "" : "s"}
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead className="hidden md:table-cell">Descripción</TableHead>
                    <TableHead>Activo</TableHead>
                    {canManage ? <TableHead className="text-right">Acciones</TableHead> : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((feriado) => (
                    <TableRow key={feriado.id}>
                      <TableCell className="whitespace-nowrap font-medium">
                        {formatFechaDisplay(feriado.fecha)}
                      </TableCell>
                      <TableCell>{feriado.titulo}</TableCell>
                      <TableCell className="hidden max-w-[240px] truncate text-medical-mutedText md:table-cell">
                        {feriado.descripcion || "—"}
                      </TableCell>
                      <TableCell>
                        {canManage ? (
                          <Switch
                            checked={feriado.activo}
                            disabled={togglingId === feriado.id}
                            onCheckedChange={() => void handleToggleActivo(feriado)}
                            aria-label={
                              feriado.activo ? "Desactivar feriado" : "Activar feriado"
                            }
                          />
                        ) : (
                          <span
                            className={
                              feriado.activo
                                ? "text-sm text-medical-primary"
                                : "text-sm text-medical-mutedText"
                            }
                          >
                            {feriado.activo ? "Sí" : "No"}
                          </span>
                        )}
                      </TableCell>
                      {canManage ? (
                        <TableCell className="text-right">
                          <div className="inline-flex gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="cursor-pointer text-medical-primary hover:bg-medical-secondary"
                              onClick={() => openEdit(feriado)}
                              aria-label="Editar feriado"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="cursor-pointer text-medical-danger hover:bg-medical-danger/10"
                              onClick={() => {
                                setDeleteError("");
                                setDeleteTarget(feriado);
                              }}
                              aria-label="Eliminar feriado"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}

          {!canManage ? (
            <p className="text-xs text-medical-mutedText">
              Solo un administrador puede crear, editar o eliminar feriados.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {dialogOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[110] flex items-center justify-center p-4"
              role="dialog"
              aria-modal="true"
            >
              <button
                type="button"
                className="absolute inset-0 cursor-pointer bg-medical-text/55 backdrop-blur-sm"
                aria-label="Cerrar"
                disabled={saving}
                onClick={closeDialog}
              />
              <form
                onSubmit={(e) => void handleSubmit(e)}
                className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-medical-border bg-white shadow-xl"
              >
                <div className="flex items-center justify-between border-b border-medical-border bg-medical-primary px-5 py-4">
                  <div className="flex items-center gap-2 text-white">
                    <CalendarDays className="size-5" />
                    <h2 className="text-base font-semibold">
                      {editing ? "Editar feriado" : "Nuevo feriado"}
                    </h2>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="cursor-pointer text-white hover:bg-white/15"
                    disabled={saving}
                    onClick={closeDialog}
                  >
                    <X className="size-5" />
                  </Button>
                </div>

                <div className="space-y-4 px-5 py-5">
                  <div>
                    <Label htmlFor="feriado-fecha" className="mb-1.5 block text-sm font-medium">
                      Fecha <span className="text-medical-danger">*</span>
                    </Label>
                    <input
                      id="feriado-fecha"
                      type="date"
                      required
                      value={form.fecha}
                      onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
                      disabled={saving}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <Label htmlFor="feriado-titulo" className="mb-1.5 block text-sm font-medium">
                      Título <span className="text-medical-danger">*</span>
                    </Label>
                    <input
                      id="feriado-titulo"
                      type="text"
                      maxLength={200}
                      value={form.titulo}
                      onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                      disabled={saving}
                      className={inputClass}
                      placeholder="Ej. Día de la Independencia"
                    />
                  </div>
                  <div>
                    <Label htmlFor="feriado-desc" className="mb-1.5 block text-sm font-medium">
                      Descripción
                    </Label>
                    <textarea
                      id="feriado-desc"
                      value={form.descripcion}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, descripcion: e.target.value }))
                      }
                      disabled={saving}
                      className={textareaClass}
                      maxLength={5000}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      id="feriado-activo"
                      checked={form.activo}
                      disabled={saving}
                      onCheckedChange={(checked) =>
                        setForm((f) => ({ ...f, activo: checked }))
                      }
                    />
                    <Label htmlFor="feriado-activo" className="text-sm font-medium">
                      Activo
                    </Label>
                  </div>

                  {formError ? (
                    <p className="rounded-xl border border-medical-danger/30 bg-medical-danger/10 px-3 py-2 text-sm text-medical-danger">
                      {formError}
                    </p>
                  ) : null}
                </div>

                <div className="flex justify-end gap-2 border-t border-medical-border px-5 py-4">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={saving}
                    className="cursor-pointer"
                    onClick={closeDialog}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="cursor-pointer bg-medical-primary text-white hover:bg-medical-primaryDark"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Guardando…
                      </>
                    ) : editing ? (
                      "Guardar cambios"
                    ) : (
                      "Crear feriado"
                    )}
                  </Button>
                </div>
              </form>
            </div>,
            document.body
          )
        : null}

      {deleteTarget && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[120] flex items-center justify-center p-4"
              role="alertdialog"
              aria-modal="true"
            >
              <button
                type="button"
                className="absolute inset-0 cursor-pointer bg-medical-text/55 backdrop-blur-sm"
                aria-label="Cerrar"
                disabled={deleting}
                onClick={() => !deleting && setDeleteTarget(null)}
              />
              <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-medical-border bg-white shadow-xl">
                <div className="flex items-start justify-between border-b border-medical-danger/30 bg-medical-danger/10 px-5 py-4">
                  <div className="flex items-center gap-2 text-medical-danger">
                    <Trash2 className="size-5 shrink-0" />
                    <h2 className="text-base font-semibold">Eliminar feriado</h2>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="cursor-pointer text-medical-danger hover:bg-medical-danger/10"
                    disabled={deleting}
                    onClick={() => setDeleteTarget(null)}
                  >
                    <X className="size-5" />
                  </Button>
                </div>
                <div className="space-y-4 px-5 py-6">
                  <p className="text-sm leading-relaxed text-medical-text">
                    ¿Eliminar{" "}
                    <span className="font-semibold text-medical-primary">
                      {deleteTarget.titulo}
                    </span>{" "}
                    ({formatFechaDisplay(deleteTarget.fecha)})? Esta acción no se puede deshacer.
                    Podés desactivarlo en su lugar si solo querés que deje de aplicarse.
                  </p>
                  <div className="flex gap-2 rounded-xl border border-medical-warning/35 bg-medical-warning/10 px-3.5 py-3 text-xs leading-relaxed text-medical-text">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-medical-warning" />
                    <span>
                      Si un servicio no tiene tarifa «feriado» ni día «cualquiera», las visitas
                      en esa fecha pueden fallar al liquidar.
                    </span>
                  </div>
                  {deleteError ? (
                    <p className="text-sm text-medical-danger">{deleteError}</p>
                  ) : null}
                </div>
                <div className="flex justify-end gap-2 border-t border-medical-border px-5 py-4">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={deleting}
                    className="cursor-pointer"
                    onClick={() => setDeleteTarget(null)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    disabled={deleting}
                    className="cursor-pointer bg-medical-danger text-white hover:bg-medical-danger/90"
                    onClick={() => void handleDelete()}
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Eliminando…
                      </>
                    ) : (
                      "Eliminar"
                    )}
                  </Button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
