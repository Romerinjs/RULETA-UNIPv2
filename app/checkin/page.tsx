"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface EstudianteData {
  nombre: string;
  documento: string;
  telefono: string | null;
  asistencia: boolean;
  programa?: { nombre: string };
  semestre?: { numero: number };
  grupo?: { nombre: string };
}

export default function CheckinPage() {
  // Form input fields
  const [boleta, setBoleta] = useState("");
  const [nombre, setNombre] = useState("");
  const [documento, setDocumento] = useState("");
  const [programa, setPrograma] = useState("");
  const [semestre, setSemestre] = useState("");
  const [grupo, setGrupo] = useState("");
  const [telefono, setTelefono] = useState("");

  // Hot-Activation Inline states
  const [telefonoInput, setTelefonoInput] = useState("");
  const [phoneError, setPhoneError] = useState("");

  // System states
  const [searching, setSearching] = useState(false);
  const [studentFound, setStudentFound] = useState<boolean | null>(null);
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false);
  const [notActivated, setNotActivated] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Modals visibility
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showAlreadyRegisteredModal, setShowAlreadyRegisteredModal] = useState(false);

  // Handle phone input changes in hot-activation mode
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
    setTelefonoInput(digitsOnly);

    if (digitsOnly.length > 0 && !digitsOnly.startsWith("3")) {
      setPhoneError("El teléfono debe iniciar con el número 3");
    } else if (digitsOnly.length > 0 && digitsOnly.length < 10) {
      setPhoneError(`Faltan dígitos (${digitsOnly.length}/10)`);
    } else {
      setPhoneError("");
    }
  };

  // Focus ref for ticket input
  const boletaInputRef = useRef<HTMLInputElement>(null);

  // Focus boleta input on page load
  useEffect(() => {
    boletaInputRef.current?.focus();
  }, []);

  // Automatic boleta lookup on reaching 4 characters
  useEffect(() => {
    const lookupBoleta = async () => {
      const boletaCode = boleta.trim().toUpperCase();

      if (boletaCode.length < 4) {
        // Reset states if input is modified
        setNombre("");
        setDocumento("");
        setPrograma("");
        setSemestre("");
        setGrupo("");
        setTelefono("");
        setStudentFound(null);
        setAlreadyCheckedIn(false);
        setNotActivated(false);
        setErrorMsg("");
        return;
      }

      if (boletaCode.length > 4) {
        // Limit to 4 characters
        setBoleta(boletaCode.slice(0, 4));
        return;
      }

      setSearching(true);
      setErrorMsg("");
      setStudentFound(null);
      setAlreadyCheckedIn(false);
      setNotActivated(false);

      try {
        const response = await fetch(`/api/estudiantes/${boletaCode}`);

        if (response.ok) {
          const data: EstudianteData = await response.json();

          setNombre(data.nombre);
          setDocumento(data.documento);
          setPrograma(data.programa?.nombre || "No asignado");
          setSemestre(data.semestre?.numero ? `${data.semestre.numero}° Semestre` : "No asignado");
          setGrupo(data.grupo?.nombre || "No asignado");
          setTelefono(data.telefono || "");
          setStudentFound(true);

          // Check mandatory activation (must have phone)
          if (data.telefono === null) {
            setNotActivated(true);
            setErrorMsg("Esta boleta no ha sido activada aún. Registra el teléfono móvil a continuación para realizar la activación y el check-in de inmediato.");
          } else if (data.asistencia) {
            setAlreadyCheckedIn(true);
            setShowAlreadyRegisteredModal(true);
            setErrorMsg("Este estudiante ya registró su asistencia al evento.");
          }
        } else {
          const errData = await response.json();
          setStudentFound(false);
          setErrorMsg(errData.error || "Boleta no encontrada en la base de datos.");
          setNombre("");
          setDocumento("");
          setPrograma("");
          setSemestre("");
          setGrupo("");
          setTelefono("");
        }
      } catch (err) {
        console.error("Error looking up boleta:", err);
        setStudentFound(false);
        setErrorMsg("Error de conexión. Intente de nuevo.");
      } finally {
        setSearching(false);
      }
    };

    lookupBoleta();
  }, [boleta]);

  // Form submission: check-in post
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentFound || alreadyCheckedIn || submitting) {
      return;
    }

    // Si requiere activación, primero validamos el campo de teléfono
    if (notActivated) {
      if (telefonoInput.length !== 10 || !telefonoInput.startsWith("3")) {
        setPhoneError("El teléfono debe iniciar con 3 y tener exactamente 10 dígitos.");
        return;
      }
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const boletaCode = boleta.trim().toUpperCase();

      // Flujo en Cascada: Paso 1. Si no está activado, enviar petición de activación
      if (notActivated) {
        const activationResponse = await fetch("/api/estudiantes/activar", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            boleta: boletaCode,
            telefono: telefonoInput.trim(),
          }),
        });

        if (!activationResponse.ok) {
          const actData = await activationResponse.json();
          setErrorMsg(actData.error || "Hubo un error al activar la boleta.");
          setSubmitting(false);
          return;
        }

        // Si la activación es exitosa, guardamos localmente el teléfono
        setTelefono(telefonoInput.trim());
      }

      // Flujo en Cascada: Paso 2. Realizar el Check-in
      const response = await fetch("/api/estudiantes/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          boleta: boletaCode,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.yaRegistrado) {
          setAlreadyCheckedIn(true);
          setShowAlreadyRegisteredModal(true);
        } else {
          setShowSuccessModal(true);
        }
      } else {
        if (response.status === 428) {
          setNotActivated(true);
        }
        setErrorMsg(data.error || "Hubo un error al registrar la asistencia.");
      }
    } catch (err) {
      console.error("Error submitting checkin:", err);
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
    setPrograma("");
    setSemestre("");
    setGrupo("");
    setTelefono("");
    setTelefonoInput("");
    setPhoneError("");
    setStudentFound(null);
    setAlreadyCheckedIn(false);
    setNotActivated(false);
    setErrorMsg("");
    setShowSuccessModal(false);
    setShowAlreadyRegisteredModal(false);
    setTimeout(() => {
      boletaInputRef.current?.focus();
    }, 100);
  };

  return (
    <div className="flex-1 bg-subtle min-h-screen flex flex-col justify-between py-6 px-4 font-sans select-none antialiased relative">
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

      {/* Decorative institutional line: Dominant green palette */}
      <div className="absolute top-0 left-0 w-full h-[6px] bg-gradient-to-r from-green-nature via-blue-primary to-green-nature z-10" />

      {/* Header section */}
      <header className="w-full max-w-md mx-auto text-center mt-4 mb-2 flex flex-col items-center">
        <span className="text-[10px] font-bold text-green-nature uppercase tracking-[2px] font-heading mb-1 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-nature animate-ping" />
          EVENTO EN VIVO
        </span>
        <h2 className="text-[20px] font-extrabold text-blue-primary font-heading tracking-tight flex items-center gap-1.5 leading-none">
          UNIPUTUMAYO
        </h2>
        <div className="w-12 h-[3px] bg-green-nature rounded-full mt-2" />
      </header>

      {/* Main content container */}
      <main className="w-full max-w-md mx-auto flex-1 flex flex-col justify-center my-6">
        <div className="bg-canvas border border-border-default rounded-xl shadow-[0_4px_20px_rgba(128,191,31,0.06)] p-6 md:p-8 flex flex-col transition-all duration-300">

          {/* Section title */}
          <div className="mb-6 text-center">
            <h1 className="font-heading text-[22px] font-bold text-ink-dark leading-tight flex justify-center items-center gap-1.5">
              <span>Registro de Asistencia</span>
            </h1>
            <p className="font-sans text-[13px] text-ink-main mt-1.5">
              Ingresa el código de boleta para verificar e ingresar al sorteo.
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
                  ref={boletaInputRef}
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
                  className="w-full py-3 pl-4 pr-10 border border-border-default rounded-lg font-mono text-[16px] font-bold tracking-wider text-ink-dark placeholder-ink-secondary/70 focus:outline-none focus:border-green-nature focus:ring-[3px] focus:ring-green-nature/20 transition-all uppercase"
                  required
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
                  {searching ? (
                    <svg className="animate-spin h-5 w-5 text-green-nature" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : studentFound === true && !notActivated && !alreadyCheckedIn ? (
                    <svg className="h-5 w-5 text-green-nature" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : studentFound === false ? (
                    <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : notActivated || alreadyCheckedIn ? (
                    <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-ink-secondary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Verified Badge */}
              {studentFound === true && !notActivated && !alreadyCheckedIn && (
                <div className="flex items-center gap-1.5 py-1 px-1 text-green-nature text-[12px] font-semibold animate-scale-in">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-nature animate-pulse" />
                  Boleta verificada y lista para check-in.
                </div>
              )}

              {/* Status Banner */}
              {errorMsg && (
                <div className={`p-3.5 rounded-lg border text-[13px] leading-relaxed flex items-start gap-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] ${alreadyCheckedIn
                  ? "bg-amber-50 border-amber-200 text-amber-800 animate-scale-in"
                  : notActivated
                    ? "bg-amber-50 border-amber-200 text-amber-800 animate-scale-in"
                    : "bg-red-50 border-red-200 text-red-700 animate-scale-in"
                  }`}>
                  <span className="text-[16px] leading-none mt-0.5">{alreadyCheckedIn ? "⚠️" : notActivated ? "⚠️" : "❌"}</span>
                  <div className="flex-1">
                    <span className="font-bold block text-[13.5px]">
                      {alreadyCheckedIn
                        ? "Asistencia Registrada"
                        : notActivated
                          ? "Activación Pendiente"
                          : "Boleta no Encontrada"
                      }
                    </span>
                    <p className="mt-0.5">{errorMsg}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Confirmation details: Pre-check */}
            {studentFound === true && (
              <div className="space-y-4 border border-border-default bg-subtle/50 rounded-lg p-4 animate-scale-in">
                <span className="text-[10px] font-extrabold text-ink-secondary uppercase tracking-[1px] block border-b border-border-default/60 pb-1.5">
                  Confirmación de Datos
                </span>

                <div className="grid grid-cols-1 gap-3 text-[13.5px]">
                  <div>
                    <span className="text-[11px] font-semibold text-ink-secondary block">
                      Nombre del Estudiante
                    </span>
                    <span className="font-bold text-ink-dark block truncate">
                      {nombre}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-ink-secondary block">
                      Documento de Identidad
                    </span>
                    <span className="font-mono font-medium text-ink-dark block">
                      {documento}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-ink-secondary block">
                      Programa Académico
                    </span>
                    <span className="font-semibold text-blue-primary block">
                      {programa}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[11px] font-semibold text-ink-secondary block">
                        Semestre
                      </span>
                      <span className="font-semibold text-ink-main block">
                        {semestre}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-ink-secondary block">
                        Grupo
                      </span>
                      <span className="font-semibold text-ink-main block">
                        {grupo}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Hot-Activation: Teléfono de Contacto (Inline) */}
            {studentFound === true && notActivated && (
              <div className="space-y-1.5 border border-amber-200 bg-amber-50/40 rounded-lg p-4 animate-scale-in">
                <div className="flex justify-between items-center">
                  <label htmlFor="telefonoInput" className="text-[13px] font-semibold text-ink-dark flex items-center gap-1.5">
                    <span>Celular de Activación</span>
                    <span className="text-red-500">*</span>
                  </label>
                </div>
                <div className="relative">
                  <input
                    id="telefonoInput"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={telefonoInput}
                    onChange={handlePhoneChange}
                    disabled={submitting}
                    placeholder="Ej: 3001234567"
                    className={`w-full py-2.5 pl-4 pr-10 border rounded-lg font-sans text-[15px] focus:outline-none transition-all ${phoneError
                      ? "border-red-300 focus:border-red-500 focus:ring-[3px] focus:ring-red-500/10 bg-canvas"
                      : telefonoInput.length === 10
                        ? "border-green-nature focus:border-green-nature focus:ring-[3px] focus:ring-green-nature/10 bg-canvas"
                        : "border-border-default focus:border-green-nature focus:ring-[3px] focus:ring-green-nature/20 bg-canvas"
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
            )}

            {/* Check-in Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={
                  !studentFound ||
                  alreadyCheckedIn ||
                  submitting ||
                  (notActivated && (telefonoInput.length !== 10 || !!phoneError))
                }
                className={`w-full py-3.5 rounded-lg text-white font-heading text-[14px] font-bold shadow-[0_4px_12px_rgba(128,191,31,0.15)] flex items-center justify-center gap-2 transition-all select-none cursor-pointer active:scale-[0.98] ${!studentFound ||
                  alreadyCheckedIn ||
                  (notActivated && (telefonoInput.length !== 10 || !!phoneError))
                  ? "bg-ink-secondary/40 text-white/70 shadow-none cursor-not-allowed"
                  : submitting
                    ? "bg-green-nature opacity-80 cursor-wait"
                    : "bg-green-nature hover:bg-green-nature/90 hover:shadow-[0_6px_18px_rgba(128,191,31,0.3)]"
                  }`}
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>{notActivated ? "Activando e ingresando..." : "Registrando asistencia..."}</span>
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    <span>{notActivated ? "Activar y Confirmar Asistencia" : "Registrar Asistencia"}</span>
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

      {/* SUCCESS CHECK-IN MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-dark/65 backdrop-blur-[4px] animate-bg-in">
          <div className="bg-canvas border border-border-default rounded-2xl w-full max-w-sm p-6 text-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-scale-in flex flex-col items-center">

            {/* Animated Checked Circle */}
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
              ¡Asistencia Registrada!
            </h3>

            {/* Modal Subtitle */}
            <p className="font-sans text-[13.5px] text-ink-main mt-2 leading-relaxed px-1">
              Registro completado. El estudiante ya puede participar en los sorteos de la ruleta.
            </p>

            {/* Confirmation Box */}
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
                <span className="font-mono font-bold text-green-nature bg-green-nature/10 px-1.5 py-0.5 rounded text-[12px]">{boleta}</span>
              </div>
              <div className="flex justify-between border-b border-border-default/60 pb-1.5">
                <span className="text-ink-secondary">Programa</span>
                <span className="font-semibold text-ink-dark text-right truncate max-w-[150px]">{programa}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-secondary">Semestre / Grupo</span>
                <span className="font-semibold text-ink-dark">{semestre} — {grupo}</span>
              </div>
            </div>

            {/* Confirm button */}
            <button
              onClick={handleReset}
              className="w-full py-3 bg-green-nature hover:bg-green-nature/90 active:scale-[0.98] text-white font-heading font-bold text-[14px] rounded-xl shadow-[0_4px_12px_rgba(128,191,31,0.25)] transition-all select-none cursor-pointer"
            >
              Aceptar y salir
            </button>
          </div>
        </div>
      )}

      {/* ALREADY REGISTERED MODAL */}
      {showAlreadyRegisteredModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-dark/65 backdrop-blur-[4px] animate-bg-in">
          <div className="bg-canvas border border-border-default rounded-2xl w-full max-w-sm p-6 text-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-scale-in flex flex-col items-center">

            {/* Amber warning badge icon */}
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5 bg-amber-500/10">
              <svg className="w-12 h-12 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            {/* Modal Heading */}
            <h3 className="font-heading text-[20px] font-extrabold text-ink-dark tracking-tight leading-tight">
              Asistencia Ya Registrada
            </h3>

            {/* Modal Subtitle */}
            <p className="font-sans text-[13.5px] text-ink-main mt-2 leading-relaxed px-1">
              Esta boleta ya completó su registro de asistencia previamente.
            </p>

            {/* Confirmation Box */}
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
                <span className="font-mono font-bold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded text-[12px]">{boleta}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-secondary">Programa Académico</span>
                <span className="font-semibold text-ink-dark text-right truncate max-w-[150px]">{programa}</span>
              </div>
            </div>

            {/* Confirm button */}
            <button
              onClick={handleReset}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white font-heading font-bold text-[14px] rounded-xl shadow-[0_4px_12px_rgba(245,158,11,0.25)] transition-all select-none cursor-pointer"
            >
              Cerrar y Reintentar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
