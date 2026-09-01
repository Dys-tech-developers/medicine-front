import { Suspense } from "react";
import PacienteFichaClient from "./PacienteFichaClient";

export default function PacienteFichaPage() {
  return (
    <Suspense>
      <PacienteFichaClient />
    </Suspense>
  );
}
