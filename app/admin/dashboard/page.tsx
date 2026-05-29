import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";

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

        {/* Módulos de Información (Cards según Design.md) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-canvas p-6 rounded-lg border border-border-default shadow-[0_2px_6px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(24,102,143,0.1)] transition-shadow">
             <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 rounded-full bg-[#80BF1F]/15 flex items-center justify-center">
                 <span className="text-green-nature text-xl">📄</span>
               </div>
               <h3 className="font-heading text-[18px] font-semibold text-ink-dark">Carga Masiva (CSV)</h3>
             </div>
             <p className="font-sans text-[14px] text-ink-main mb-6">
               Sube el listado de estudiantes permitidos para participar en el sorteo. Asegúrate de que el archivo cumpla con la estructura de IDs requerida.
             </p>
             <button className="w-full flex justify-center py-[10px] px-[24px] rounded-lg text-white font-sans text-[14px] font-semibold bg-blue-primary shadow-[0_4px_12px_rgba(24,102,143,0.2)] hover:bg-blue-hover transition-colors">
               Ir a Carga de Archivos
             </button>
          </div>
          
          <div className="bg-canvas p-6 rounded-lg border border-border-default shadow-[0_2px_6px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(24,102,143,0.1)] transition-shadow">
             <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 rounded-full bg-[#F5A51D]/15 flex items-center justify-center">
                 <span className="text-orange-energy text-xl">🎡</span>
               </div>
               <h3 className="font-heading text-[18px] font-semibold text-ink-dark">Ruleta Institucional</h3>
             </div>
             <p className="font-sans text-[14px] text-ink-main mb-6">
               Inicia el sorteo en vivo en pantalla gigante. Se seleccionará aleatoriamente un ganador entre los estudiantes que marcaron asistencia.
             </p>
             <button className="w-full flex justify-center py-[10px] px-[24px] rounded-lg text-white font-sans text-[14px] font-semibold bg-gradient-to-br from-blue-primary to-orange-energy shadow-[0_4px_12px_rgba(24,102,143,0.2)] hover:opacity-90 transition-opacity">
               Abrir Pantalla de Ruleta
             </button>
          </div>
        </div>

      </div>
    </div>
  );
}
