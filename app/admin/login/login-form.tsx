"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError("Credenciales incorrectas. Por favor intente de nuevo.");
      } else {
        router.push("/admin/dashboard");
        router.refresh();
      }
    } catch {
      setError("Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-[#c48011] bg-[#F5A51D]/15 rounded-md text-center font-sans font-medium border border-[#F5A51D]/30">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block font-sans text-[14px] font-medium text-ink-main"
        >
          Correo Electrónico
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="admin@evento.com"
          className="w-full px-4 py-3 rounded-md border border-border-default focus:outline-none focus:border-blue-primary focus:ring-1 focus:ring-blue-primary font-sans text-[14px] text-ink-dark placeholder:text-ink-secondary bg-white transition-colors"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block font-sans text-[14px] font-medium text-ink-main"
        >
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          placeholder="••••••••"
          className="w-full px-4 py-3 rounded-md border border-border-default focus:outline-none focus:border-blue-primary focus:ring-1 focus:ring-blue-primary font-sans text-[14px] text-ink-dark placeholder:text-ink-secondary bg-white transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-[12px] px-[24px] rounded-lg text-white font-sans text-[14px] font-semibold bg-gradient-to-br from-blue-primary to-orange-energy shadow-[0_4px_12px_rgba(24,102,143,0.2)] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-primary transition-all disabled:opacity-50"
      >
        {loading ? "Ingresando..." : "Ingresar al Sistema"}
      </button>
    </form>
  );
}
