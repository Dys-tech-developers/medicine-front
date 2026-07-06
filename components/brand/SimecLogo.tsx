import Image from "next/image";
import { cn } from "@/lib/utils";

export const SIMEC_LOGO_SRC = "/simeclogo1.png";

type SimecLogoProps = {
  size?: number;
  className?: string;
  /** Fondo circular blanco; útil sobre headers oscuros o la credencial. */
  variant?: "default" | "circle";
};

export function SimecLogo({
  size = 40,
  className,
  variant = "default",
}: SimecLogoProps) {
  const image = (
    <Image
      src={SIMEC_LOGO_SRC}
      alt="SIMEC"
      width={size}
      height={size}
      className="object-contain"
      priority
    />
  );

  if (variant === "circle") {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white p-0.5",
          className
        )}
        style={{ width: size, height: size }}
      >
        {image}
      </span>
    );
  }

  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center", className)}>
      {image}
    </span>
  );
}
