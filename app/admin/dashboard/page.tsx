import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import DashboardClient from "./dashboard-client";

export const metadata = {
  title: "Dashboard Institucional | UNIPUTUMAYO",
};

export default async function DashboardPage() {
  // === MODO DESARROLLO / PRUEBAS RÁPIDAS ===
  // Si deseas saltarte el login durante el desarrollo, descomenta esta variable
  // y comenta la validación real de sesión de abajo.
  // const devSession = { user: { name: "Admin Dev" } };
  
  // === VALIDACIÓN REAL DE SEGURIDAD ===
  const session = await auth();
  
  if (!session) {
    redirect("/admin/login");
  }

  // Si usas el modo Dev, cambia 'session' por 'devSession' en el renderizado
  
  return (
    <div className="min-h-screen bg-subtle p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header / Hero */}
        <header className="flex items-center justify-between bg-canvas p-6 rounded-lg border border-border-default shadow-[0_2px_6px_rgba(0,0,0,0.05)]">
          <div>
            <h1 className="font-heading text-[24px] font-bold text-ink-dark">
              Panel de Control
            </h1>
            <p className="font-sans text-[14px] text-ink-main mt-1">
              Bienvenido, <span className="font-semibold text-blue-primary">{session.user?.name || "Administrador"}</span>
            </p>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/admin/login" });
            }}
          >
             <button 
               type="submit" 
               className="px-6 py-2 bg-canvas text-blue-primary border border-blue-primary rounded-lg font-sans text-[14px] font-semibold hover:bg-[#18668F]/5 transition-colors"
             >
               Cerrar Sesión
             </button>
          </form>
        </header>

        <DashboardClient />

      </div>
    </div>
  );
}
