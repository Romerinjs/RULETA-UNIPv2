import LoginForm from "./login-form";

export const metadata = {
  title: "Acceso Administrativo | UNIPUTUMAYO",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas">
      <div className="w-full max-w-md p-8 bg-white border border-border-default rounded-lg shadow-[0_2px_6px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(24,102,143,0.1)] transition-shadow duration-300">
        <div className="text-center mb-8">
          <h1 className="font-heading text-[36px] font-bold leading-[1.2] text-ink-dark">
            Acceso Institucional
          </h1>
          <p className="font-sans text-[16px] text-ink-main mt-2">
            Sistema de Sorteo y Asistencia
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
