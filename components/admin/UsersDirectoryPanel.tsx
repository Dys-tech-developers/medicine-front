"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Pencil, RefreshCw, ShieldAlert, Users } from "lucide-react";
import { UserEditDialog } from "@/components/admin/UserEditDialog";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiError } from "@/lib/api/client";
import { mapAuthApiError } from "@/lib/api/auth-errors";
import { listUsersWithApi, updateUserEstadoWithApi } from "@/lib/api/users";
import type { UserListItemDto } from "@/lib/api/types";
import {
  DEFAULT_MIN_LOADING_MS,
  delayRemaining,
} from "@/lib/loading/minimum-duration";
import { estadoActivoBadgeClass } from "@/lib/medical-ui-classes";
import { formatUserRoles } from "@/lib/user-roles-display";
import { cn } from "@/lib/utils";

const thClass =
  "px-4 py-3 text-xs font-bold uppercase tracking-wide text-medical-primaryDark first:pl-6 last:pr-5 sm:px-5";
const tdClass = "px-4 py-4 align-middle first:pl-6 last:pr-5 sm:px-5";

type Props = {
  accessToken: string;
  onNotify: (title: string, type: "success" | "error", detail?: string) => void;
};

export function UsersDirectoryPanel({ accessToken, onNotify }: Props) {
  const [items, setItems] = useState<UserListItemDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);
  const [editTarget, setEditTarget] = useState<UserListItemDto | null>(null);
  const [estadoLoadingId, setEstadoLoadingId] = useState<number | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    setForbidden(false);
    const startedAt = Date.now();
    try {
      const data = await listUsersWithApi(accessToken, page, pageSize);
      await delayRemaining(DEFAULT_MIN_LOADING_MS, startedAt);
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setForbidden(true);
        setItems([]);
        setTotal(0);
        return;
      }
      const message =
        err instanceof ApiError
          ? mapAuthApiError(err, "admin")
          : "No se pudieron cargar los usuarios.";
      setError(message);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [accessToken, page, pageSize]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const handleEstadoToggle = useCallback(
    async (user: UserListItemDto, nextEstado: boolean) => {
      setEstadoLoadingId(user.id);
      const startedAt = Date.now();
      try {
        const updated = await updateUserEstadoWithApi(accessToken, user.id, {
          estado: nextEstado,
        });
        await delayRemaining(DEFAULT_MIN_LOADING_MS, startedAt);
        setItems((prev) => prev.map((u) => (u.id === user.id ? { ...u, ...updated } : u)));
        onNotify(
          nextEstado ? "Usuario activado" : "Usuario desactivado",
          "success",
          user.nombre
        );
      } catch (err) {
        const message =
          err instanceof ApiError
            ? mapAuthApiError(err, "admin")
            : "No se pudo actualizar el estado.";
        onNotify(message, "error", user.nombre);
      } finally {
        setEstadoLoadingId(null);
      }
    },
    [accessToken, onNotify]
  );

  const handleUserUpdated = useCallback((updated: UserListItemDto) => {
    setItems((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)));
    onNotify("Usuario actualizado", "success", updated.nombre);
  }, [onNotify]);

  if (forbidden) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-medical-danger/30 bg-medical-danger/5 px-6 py-10 text-center">
        <ShieldAlert className="h-10 w-10 text-medical-danger" />
        <p className="text-sm font-semibold text-medical-text">Sin permisos</p>
        <p className="max-w-sm text-sm text-medical-mutedText">
          Solo los administradores pueden gestionar usuarios del sistema.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-medical-text">Usuarios del sistema</h3>
          <p className="text-xs text-medical-mutedText">
            {total} usuario{total === 1 ? "" : "s"} registrados
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="cursor-pointer"
          onClick={() => void loadUsers()}
          disabled={loading}
        >
          <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", loading && "animate-spin")} />
          Actualizar
        </Button>
      </div>

      {error ? (
        <div className="rounded-xl border border-medical-danger/30 bg-medical-danger/5 px-4 py-3 text-sm text-medical-danger">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-medical-border bg-white">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-medical-secondary/90 hover:bg-medical-secondary/90">
                <TableHead className={thClass}>Usuario</TableHead>
                <TableHead className={cn(thClass, "hidden md:table-cell")}>Roles</TableHead>
                <TableHead className={thClass}>Estado</TableHead>
                <TableHead className={cn(thClass, "w-[90px] text-right")}>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-12 text-center text-sm text-medical-mutedText">
                    <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                    Cargando usuarios…
                  </TableCell>
                </TableRow>
              ) : null}

              {!loading && items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <EmptyState
                      icon={Users}
                      title="Sin usuarios"
                      description="No hay usuarios para mostrar en esta página."
                    />
                  </TableCell>
                </TableRow>
              ) : null}

              {items.map((user) => (
                <TableRow key={user.id} className="hover:bg-medical-surface/60">
                  <TableCell className={tdClass}>
                    <div>
                      <p className="font-semibold text-medical-text">{user.nombre}</p>
                      <p className="text-xs text-medical-mutedText">{user.email}</p>
                      <p className="mt-1 text-xs text-medical-mutedText md:hidden">
                        {formatUserRoles(user.roles)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className={cn(tdClass, "hidden md:table-cell")}>
                    <span className="text-sm text-medical-text">{formatUserRoles(user.roles)}</span>
                  </TableCell>
                  <TableCell className={tdClass}>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={user.estado}
                        disabled={estadoLoadingId === user.id}
                        onCheckedChange={(checked) => void handleEstadoToggle(user, checked)}
                        aria-label={`${user.estado ? "Desactivar" : "Activar"} a ${user.nombre}`}
                      />
                      <span
                        className={cn(
                          "rounded-md border px-2 py-0.5 text-xs font-semibold",
                          estadoActivoBadgeClass(user.estado)
                        )}
                      >
                        {user.estado ? "Activo" : "Inactivo"}
                      </span>
                      {estadoLoadingId === user.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-medical-mutedText" />
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className={cn(tdClass, "text-right")}>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="cursor-pointer"
                      onClick={() => setEditTarget(user)}
                      aria-label={`Editar ${user.nombre}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-medical-border px-4 py-3">
            <p className="text-xs text-medical-mutedText">
              Página {page} de {totalPages}
            </p>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="cursor-pointer"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="cursor-pointer"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
                aria-label="Página siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <UserEditDialog
        open={Boolean(editTarget)}
        user={editTarget}
        accessToken={accessToken}
        onClose={() => setEditTarget(null)}
        onUpdated={handleUserUpdated}
      />
    </div>
  );
}
