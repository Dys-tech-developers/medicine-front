// src/app/HomeClient.tsx
"use client";

import dynamic from "next/dynamic";

const UserLocationMap = dynamic(
  () => import("../components/UserLocationMap"),
  { ssr: false }
);

export default function HomeClient() {
  return (
    <>
      <h1>Home</h1>
      <UserLocationMap />
    </>
  );
}