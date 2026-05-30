"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";

interface EstudianteData {
  nombre: string;
  documento: string;
  telefono: string | null;
  asistencia: boolean;
}

export default function ActivarBoletaPage() {
  // Input fields
  const [boleta, setBoleta] = useState("");
  const [nombre, setNombre] = useState("");
  const [documento, setDocumento] = useState("");
  const [telefono, setTelefono] = useState("");

  // States
  const [searching, setSearching] = useState(false);
  const [studentFound, setStudentFound] = useState<boolean | null>(null);
  const [alreadyActivated, setAlreadyActivated] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Field error states for the phone
  const [phoneError, setPhoneError] = useState("");

  // Ref to automatically focus the phone input
  const phoneInputRef = useRef<HTMLInputElement>(null);

  // Dynamic ticket lookup when code reaches exactly 4 characters
  useEffect(() => {
    const lookupBoleta = async () => {
      const boletaCode = boleta.trim().toUpperCase();

      if (boletaCode.length < 4) {
        // Reset states if user deletes characters
        setNombre("");
        setDocumento("");
        setStudentFound(null);
        setAlreadyActivated(false);
        setErrorMsg("");
        setPhoneError("");
        return;
      }

      if (boletaCode.length > 4) {
        // Enforce strictly 4 characters
        setBoleta(boletaCode.slice(0, 4));
        return;
      }

      setSearching(true);
      setErrorMsg("");
      setStudentFound(null);
      setAlreadyActivated(false);

      try {
        const response = await fetch(`/api/estudiantes/${boletaCode}`);

        if (response.ok) {
          const data: EstudianteData = await response.json();

          setNombre(data.nombre);
          setDocumento(data.documento);
          setStudentFound(true);

          if (data.telefono !== null) {
            setAlreadyActivated(true);
            setErrorMsg("Esta boleta ya ha sido activada previamente.");
          } else {
            // Auto-focus phone input for optimized mobile UX
            setTimeout(() => {
              phoneInputRef.current?.focus();
            }, 100);
          }
        } else {
          const errData = await response.json();
          setStudentFound(false);
          setErrorMsg(errData.error || "Boleta no encontrada en la base de datos.");
          setNombre("");
          setDocumento("");
        }
      } catch (err) {
        console.error("Error looking up boleta:", err);
        setStudentFound(false);
        setErrorMsg("Error de conexión. Intente nuevamente.");
      } finally {
        setSearching(false);
      }
    };

    lookupBoleta();
  }, [boleta]);

  // Handle phone changes (filtering letters, allowing only numbers)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Strip out all non-digits. Enforce 10-digit limit.
    const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
    setTelefono(digitsOnly);

    // Dynamic, visual validation feedback for the user
    if (digitsOnly.length > 0 && !digitsOnly.startsWith("3")) {
      setPhoneError("El teléfono debe iniciar con el número 3");
    } else if (digitsOnly.length > 0 && digitsOnly.length < 10) {
      setPhoneError(`Faltan dígitos (${digitsOnly.length}/10)`);
    } else {
      setPhoneError("");
    }
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentFound || alreadyActivated) {
      return;
    }

    // Double check constraints
    if (!boleta.trim() || !nombre.trim() || !documento.trim() || !telefono.trim()) {
      setErrorMsg("Todos los campos son obligatorios.");
      return;
    }

    if (telefono.length !== 10) {
      setPhoneError("El teléfono debe tener exactamente 10 dígitos.");
      return;
    }

    if (!telefono.startsWith("3")) {
      setPhoneError("El teléfono debe iniciar con el número 3.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const response = await fetch("/api/estudiantes/activar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          boleta: boleta.trim().toUpperCase(),
          telefono: telefono.trim(),
        }),
      });

      if (response.ok) {
        setShowModal(true);
      } else {
        const data = await response.json();
        setErrorMsg(data.error || "Hubo un error al activar la boleta.");
      }
    } catch (err) {
      console.error("Error submitting activation:", err);
      setErrorMsg("Error de conexión con el servidor. Intente nuevamente.");
    } finally {
      setSubmitting(false);
    }
  };

  // Reset page state to handle a new registration
  const handleReset = () => {
    setBoleta("");
    setNombre("");
    setDocumento("");
    setTelefono("");
    setStudentFound(null);
    setAlreadyActivated(false);
    setErrorMsg("");
    setPhoneError("");
    setShowModal(false);
  };

  return (
    <div className="flex-1 bg-subtle min-h-screen flex flex-col justify-between py-6 px-4 font-sans select-none antialiased">
      {/* Dynamic animations injection */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes scaleIn {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes modalBgIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes drawCheck {
          0% { stroke-dashoffset: 48; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes circleFill {
          0% { stroke-dasharray: 0, 150; }
          100% { stroke-dasharray: 150, 150; }
        }
        .animate-scale-in {
          animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .animate-bg-in {
          animation: modalBgIn 0.25s ease-out forwards;
        }
        .check-circle {
          stroke-dasharray: 150, 150;
          animation: circleFill 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .check-path {
          stroke-dasharray: 48;
          stroke-dashoffset: 48;
          animation: drawCheck 0.4s 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}} />

      {/* Decorative branding elements in background */}
      <div className="absolute top-0 left-0 w-full h-[6px] bg-gradient-to-r from-blue-primary via-green-nature to-orange-energy z-10" />

      {/* Header section */}
      <header className="w-full max-w-md mx-auto text-center mt-4 mb-2 flex flex-col items-center">
        <span className="text-[10px] font-bold text-orange-energy uppercase tracking-[2px] font-heading mb-1">
          Institución Universitaria
        </span>
        <h2 className="text-[20px] font-extrabold text-blue-primary font-heading tracking-tight flex items-center gap-1.5 leading-none">
          UNIPUTUMAYO
        </h2>
        <div className="w-12 h-[3px] bg-green-nature rounded-full mt-2" />
      </header>

      {/* Main content container */}
      <main className="w-full max-w-md mx-auto flex-1 flex flex-col justify-center my-6">
        <div className="bg-canvas border border-border-default rounded-xl shadow-[0_4px_20px_rgba(24,102,143,0.06)] p-6 md:p-8 flex flex-col transition-all duration-300">

          {/* Section title */}
          <div className="mb-6 text-center">
            <h1 className="font-heading text-[22px] font-bold text-ink-dark leading-tight">
              Pre-Registro de Asistentes
            </h1>
            <p className="font-sans text-[13px] text-ink-main mt-1.5">
              Activa tu boleta para participar en el sorteo institucional en vivo.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Field: Boleta */}
            <div className="space-y-1.5">
              <label htmlFor="boleta" className="block text-[13px] font-semibold text-ink-dark">
                Código de Boleta
              </label>
              <div className="relative">
                <input
                  id="boleta"
                  type="number"
                  onKeyDown={(e) => {
                    if (['e', 'E', '+', '-'].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  maxLength={4}
                  value={boleta}
                  onChange={(e) => setBoleta(e.target.value)}
                  placeholder="Ej: 1234"
                  disabled={submitting}
                  className="w-full py-3 pl-4 pr-10 border border-border-default rounded-lg font-mono text-[16px] font-bold tracking-wider text-ink-dark placeholder-ink-secondary/70 focus:outline-none focus:border-blue-primary focus:ring-[3px] focus:ring-blue-primary/20 transition-all uppercase"
                  required
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
                  {searching ? (
                    <svg className="animate-spin h-5 w-5 text-blue-primary" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : studentFound === true ? (
                    <svg className="h-5 w-5 text-green-nature" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : studentFound === false ? (
                    <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-ink-secondary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Status alerts */}
              {studentFound === true && !alreadyActivated && (
                <div className="flex items-center gap-1.5 py-1 px-1 text-green-nature text-[12px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-nature animate-pulse" />
                  Estudiante verificado en base de datos.
                </div>
              )}

              {errorMsg && (
                <div className={`p-3 rounded-lg border text-[13px] leading-relaxed flex items-start gap-2 ${alreadyActivated
                  ? "bg-amber-50 border-amber-200 text-amber-800"
                  : "bg-red-50 border-red-200 text-red-700"
                  }`}>
                  <span className="text-[15px] leading-none mt-0.5">{alreadyActivated ? "⚠️" : "❌"}</span>
                  <div>
                    <span className="font-semibold block">{alreadyActivated ? "Boleta Activada" : "Error de Boleta"}</span>
                    {errorMsg}
                  </div>
                </div>
              )}
            </div>

            {/* Read-Only: Nombre */}
            <div className="space-y-1.5">
              <label htmlFor="nombre" className="block text-[13px] font-semibold text-ink-dark">
                Nombre Completo
              </label>
              <div className="relative">
                <input
                  id="nombre"
                  type="text"
                  value={nombre}
                  readOnly
                  placeholder="Pendiente de verificar boleta"
                  className="w-full py-3 pl-4 pr-10 border border-border-default rounded-lg bg-subtle text-ink-main font-semibold text-[14px] focus:outline-none cursor-not-allowed transition-all select-none"
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-secondary/60">
                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Read-Only: Documento */}
            <div className="space-y-1.5">
              <label htmlFor="documento" className="block text-[13px] font-semibold text-ink-dark">
                Documento de Identidad
              </label>
              <div className="relative">
                <input
                  id="documento"
                  type="text"
                  value={documento}
                  readOnly
                  placeholder="Pendiente de verificar boleta"
                  className="w-full py-3 pl-4 pr-10 border border-border-default rounded-lg bg-subtle text-ink-main font-semibold text-[14px] focus:outline-none cursor-not-allowed transition-all select-none"
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-secondary/60">
                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Input: Teléfono */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="telefono" className="text-[13px] font-semibold text-ink-dark">
                  Teléfono de Contacto <span className="text-red-500">*</span>
                </label>
              </div>
              <div className="relative">
                <input
                  id="telefono"
                  ref={phoneInputRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={telefono}
                  onChange={handlePhoneChange}
                  disabled={!studentFound || alreadyActivated || submitting}
                  placeholder={studentFound && !alreadyActivated ? "Ej: 3001234567" : "Primero verifique su boleta"}
                  className={`w-full py-3 pl-4 pr-10 border rounded-lg font-sans text-[15px] focus:outline-none transition-all ${!studentFound || alreadyActivated
                    ? "bg-subtle/40 border-border-default cursor-not-allowed placeholder-ink-secondary/50"
                    : phoneError
                      ? "border-red-300 focus:border-red-500 focus:ring-[3px] focus:ring-red-500/10"
                      : telefono.length === 10
                        ? "border-green-nature focus:border-green-nature focus:ring-[3px] focus:ring-green-nature/10"
                        : "border-border-default focus:border-blue-primary focus:ring-[3px] focus:ring-blue-primary/20"
                    }`}
                  required
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-secondary/60">
                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
              </div>

              {phoneError && (
                <p className="text-red-500 text-[11px] font-semibold mt-1 flex items-center gap-1">
                  <span>⚠️</span> {phoneError}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!studentFound || alreadyActivated || submitting || telefono.length !== 10 || !!phoneError}
                className={`w-full py-3.5 rounded-lg text-white font-heading text-[14px] font-bold shadow-[0_4px_12px_rgba(24,102,143,0.15)] flex items-center justify-center gap-2 transition-all select-none cursor-pointer active:scale-[0.98] ${!studentFound || alreadyActivated || telefono.length !== 10 || !!phoneError
                  ? "bg-ink-secondary/40 text-white/70 shadow-none cursor-not-allowed"
                  : submitting
                    ? "bg-blue-primary opacity-80 cursor-wait"
                    : "bg-gradient-to-r from-blue-primary to-orange-energy hover:from-blue-hover hover:to-orange-energy hover:shadow-[0_6px_18px_rgba(245,165,29,0.25)]"
                  }`}
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Guardando registro...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    <span>Activar Boleta</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer / Copyright */}
      <footer className="w-full text-center py-2">
        <p className="text-[11px] text-ink-secondary/80 font-sans">
          © {new Date().getFullYear()} Institución Universitaria del Putumayo.
        </p>
        <p className="text-[9px] text-ink-secondary/60 font-sans mt-0.5">
          Vigilada Mineducación — Todos los derechos reservados.
        </p>
      </footer>

      {/* GORGEOUS VERIFIED Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-dark/65 backdrop-blur-[4px] animate-bg-in">
          <div className="bg-canvas border border-border-default rounded-2xl w-full max-w-sm p-6 text-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-scale-in flex flex-col items-center">

            {/* Super premium verified checkmark icon container */}
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5 bg-green-nature/10">
              <svg className="w-20 h-20" viewBox="0 0 52 52">
                <circle
                  className="check-circle"
                  cx="26"
                  cy="26"
                  r="23"
                  fill="none"
                  stroke="#80BF1F"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <path
                  className="check-path"
                  fill="none"
                  stroke="#80BF1F"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 26l8 8 16-16"
                />
              </svg>
            </div>

            {/* Modal Heading */}
            <h3 className="font-heading text-[22px] font-extrabold text-ink-dark tracking-tight leading-tight">
              ¡Registrado!
            </h3>

            {/* Modal Subtitle */}
            <p className="font-sans text-[13.5px] text-ink-main mt-2 leading-relaxed px-1">
              Tu boleta ha sido vinculada exitosamente con tu número telefónico.
            </p>

            {/* Recipient summary card */}
            <div className="w-full bg-subtle/80 border border-border-default rounded-xl p-4 my-5 text-left space-y-2 text-[13px] font-sans">
              <div className="flex justify-between border-b border-border-default/60 pb-1.5">
                <span className="text-ink-secondary">Estudiante</span>
                <span className="font-semibold text-ink-dark text-right truncate max-w-[150px]">{nombre}</span>
              </div>
              <div className="flex justify-between border-b border-border-default/60 pb-1.5">
                <span className="text-ink-secondary">Documento</span>
                <span className="font-mono font-medium text-ink-dark">{documento}</span>
              </div>
              <div className="flex justify-between border-b border-border-default/60 pb-1.5">
                <span className="text-ink-secondary">Código Boleta</span>
                <span className="font-mono font-bold text-blue-primary bg-blue-primary/10 px-1.5 py-0.5 rounded text-[12px]">{boleta}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-secondary">Teléfono registrado</span>
                <span className="font-mono font-semibold text-ink-dark">{telefono}</span>
              </div>
            </div>

            {/* Confirm button */}
            <button
              onClick={handleReset}
              className="w-full py-3 bg-green-nature hover:bg-green-nature/90 active:scale-[0.98] text-white font-heading font-bold text-[14px] rounded-xl shadow-[0_4px_12px_rgba(128,191,31,0.25)] transition-all select-none cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
