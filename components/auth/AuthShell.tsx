import Link from "next/link";
import { SimecLogo } from "@/components/brand/SimecLogo";
import { Lock } from "lucide-react";

type AuthShellProps = {
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function AuthShell({ children, footer }: AuthShellProps) {
  return (
    <>
      <style>{`
        .shimmer-btn { position: relative; overflow: hidden; }
        .shimmer-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%);
          transform: translateX(-100%);
          transition: transform 0.55s ease;
        }
        .shimmer-btn:not(:disabled):hover::after { transform: translateX(100%); }

        .input-float-label {
          top: 50%;
          transform: translateY(-50%);
          font-size: 0.875rem;
          color: #64748b;
          transition: top 0.18s ease, transform 0.18s ease, font-size 0.18s ease, color 0.18s ease;
        }
        .peer:focus ~ .input-float-label,
        .peer:not(:placeholder-shown) ~ .input-float-label {
          top: 12px;
          transform: translateY(0);
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.03em;
        }
        .peer:focus ~ .input-float-label { color: #454c92; }
        .peer:not(:placeholder-shown):not(:focus) ~ .input-float-label { color: #64748b; }

        .peer:focus {
          border-color: #454c92 !important;
          box-shadow: 0 0 0 4px rgba(69, 76, 146, 0.10);
          background: #fff !important;
        }
      `}</style>

      <div className="flex min-h-dvh w-full overflow-hidden">
        <aside className="relative hidden overflow-hidden lg:block lg:w-[56%] xl:w-[32%]">
          <div
            className="absolute inset-0 bg-cover bg-no-repeat"
            style={{ backgroundImage: "url('./portadamed.png')" }}
          />
        </aside>

        <main className="relative flex flex-1 items-center justify-center overflow-hidden bg-white px-6 py-10 sm:px-10">
          <i className="icon-[tabler--stethoscope] pointer-events-none absolute -top-5 -left-5 text-[130px] text-medical-mutedText/25 rotate-12" aria-hidden="true" />
          <i className="icon-[tabler--pill] pointer-events-none absolute top-28 left-10 text-[64px] text-medical-accent/20 -rotate-20" aria-hidden="true" />
          <i className="icon-[tabler--heart] pointer-events-none absolute top-10 right-6 text-[72px] text-medical-primary/12 rotate-6" aria-hidden="true" />
          <i className="icon-[tabler--microscope] pointer-events-none absolute top-1/3 -right-6 text-[96px] text-medical-mutedText/20 rotate-45" aria-hidden="true" />
          <i className="icon-[tabler--activity-heartbeat] pointer-events-none absolute top-1/2 left-4 text-[58px] text-medical-accent/15 -rotate-6" aria-hidden="true" />
          <i className="icon-[tabler--first-aid-kit] pointer-events-none absolute bottom-28 right-8 text-[68px] text-medical-primary/10 rotate-12" aria-hidden="true" />
          <i className="icon-[tabler--dna-2] pointer-events-none absolute -bottom-6 left-10 text-[110px] text-medical-mutedText/20 -rotate-12" aria-hidden="true" />
          <i className="icon-[tabler--vaccine] pointer-events-none absolute -bottom-4 -right-4 text-[88px] text-medical-accent/15 rotate-25" aria-hidden="true" />

          <div className="relative z-10 w-full max-w-[400px]">
            <div className="mb-8">
              <SimecLogo size={132} />
              <p className="mt-1 text-sm font-medium text-medical-mutedText">
                Plataforma de gestión médica
              </p>
            </div>

            {children}

            {footer ?? (
              <p className="mt-7 text-center text-sm text-medical-mutedText">
                <Link
                  href="/login"
                  className="font-bold text-medical-primary transition hover:text-medical-primaryDark hover:underline"
                >
                  Volver al inicio de sesión
                </Link>
              </p>
            )}

            <div className="mt-5 flex items-center justify-center gap-1.5">
              <Lock className="h-3 w-3 text-gray-300" />
              <span className="text-[11px] font-medium text-gray-300">
                Conexión encriptada · SSL/TLS · HIPAA Ready
              </span>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

export const authInputClass =
  "peer h-[58px] w-full rounded-2xl border-2 border-gray-100 bg-gray-50/60 px-4 pb-2 pt-6 text-sm font-medium text-medical-text outline-none transition-all";

export const authFloatLabelClass =
  "input-float-label pointer-events-none absolute left-4";

export const authPrimaryButtonClass =
  "shimmer-btn group mt-2 flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl text-sm font-bold text-white shadow-lg shadow-medical-primary/30 transition-all hover:scale-[1.015] hover:shadow-xl hover:shadow-medical-primary/40 focus:outline-none focus:ring-4 focus:ring-medical-primary/30 disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-65 active:scale-[0.99]";

export const authPrimaryButtonStyle = {
  background: "linear-gradient(135deg, #454c92 0%, #4b6a87 100%)",
};

export function AuthErrorAlert({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-center gap-3 rounded-2xl border border-medical-danger/20 bg-medical-danger/10 px-4 py-3"
    >
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-medical-danger/15">
        <span className="h-1.5 w-1.5 rounded-full bg-medical-danger" />
      </div>
      <p className="text-sm font-medium text-medical-danger">{message}</p>
    </div>
  );
}

export function AuthSuccessAlert({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="flex items-center gap-3 rounded-2xl border border-medical-accent/30 bg-medical-accent/10 px-4 py-3"
    >
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-medical-accent/20">
        <span className="h-1.5 w-1.5 rounded-full bg-medical-accent" />
      </div>
      <p className="text-sm font-medium text-medical-text">{message}</p>
    </div>
  );
}
