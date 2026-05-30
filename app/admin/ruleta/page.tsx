import { auth } from "@/auth";
import { redirect } from "next/navigation";
import RuletaClient from "./ruleta-client";

export const metadata = {
  title: "Sorteo en Vivo | Ruleta UNIPUTUMAYO",
};

export default async function RuletaPage() {
  // Enforce server-side session authorization guard
  const session = await auth();

  if (!session) {
    redirect("/admin/login");
  }

  return <RuletaClient />;
}
