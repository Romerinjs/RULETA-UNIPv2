"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface StudentWinner {
  nombre: string;
  documento: string;
  boleta: string;
  programa?: { nombre: string };
  semestre?: { numero: number };
  grupo?: { nombre: string };
}

// Tape elements height in pixels
const ROW_HEIGHT = 80;
// We repeat 0-9 sequence 8 times to allow long, smooth infinite scroll
const TAPE_REPETITIONS = 8;
const DIGIT_SEQUENCE = Array.from({ length: 10 * TAPE_REPETITIONS }, (_, i) => i % 10);

export default function RuletaClient() {
  // Target digits of the winning ticket
  const [digits, setDigits] = useState<number[]>([0, 0, 0, 0]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [leverPulled, setLeverPulled] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Winner information
  const [winner, setWinner] = useState<StudentWinner | null>(null);
  const [showWinnerCard, setShowWinnerCard] = useState(false);

  // Individual digit column states (for indicators)
  const [colStatuses, setColStatuses] = useState<("LISTO" | "GIRANDO")[]>(["LISTO", "LISTO", "LISTO", "LISTO"]);
  // Target indexes on the ribbon to stop at
  const [colTargets, setColTargets] = useState<number[]>([1, 1, 1, 1]); // Default to digit 0 (index 1 is middle)
  // Continuous infinite spinning active states per column
  const [colSpinning, setColSpinning] = useState<boolean[]>([false, false, false, false]);

  // Audio refs or effects could be added here, we keep it zero-dependencies CSS-powered
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(clearTimeout);
    };
  }, []);

  // Trigger the live raffle spin
  const handleSpin = async () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setLeverPulled(true);
    setErrorMsg("");
    setShowWinnerCard(false);

    // Mechanics: Lever tilts down for 500ms
    setTimeout(() => {
      setLeverPulled(false);
    }, 500);

    // Set all column indicators to "GIRANDO" immediately and trigger fast loop spin
    setColStatuses(["GIRANDO", "GIRANDO", "GIRANDO", "GIRANDO"]);
    setColSpinning([true, true, true, true]);

    try {
      // API call to select the winner and lock in database
      const response = await fetch("/api/admin/ruleta/sortear", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Hubo un error al realizar el sorteo.");
      }

      const winnerData: StudentWinner = data.ganador;
      const boletaDigits = winnerData.boleta.split("").map(Number);

      // Ensure boleta is exactly 4 digits
      if (boletaDigits.length !== 4) {
        throw new Error("La boleta del ganador no tiene el formato de 4 dígitos.");
      }

      // Save winner details in state (will be revealed later)
      setWinner(winnerData);
      setDigits(boletaDigits);

      // Deceleration Sequence (Sequential ease-out stop of each column)
      // Base offset: we stop at the 6th repetition (index 60+) of the digit tape
      const baseRepetition = 60;

      // --- Column 1 (Thousands) ---
      // Spins at top speed for 2.0s, decelerates over 2.0s -> Locks exactly at 4.0s
      const t1Start = setTimeout(() => {
        setColTargets(prev => [baseRepetition + boletaDigits[0], prev[1], prev[2], prev[3]]);
        setColSpinning(prev => [false, prev[1], prev[2], prev[3]]);
      }, 2000);
      const t1End = setTimeout(() => {
        setColStatuses(prev => ["LISTO", prev[1], prev[2], prev[3]]);
      }, 4000);

      // --- Column 2 (Centenas) ---
      // Spins at top speed for 6.0s, decelerates over 2.0s -> Locks exactly at 8.0s
      const t2Start = setTimeout(() => {
        setColTargets(prev => [prev[0], baseRepetition + boletaDigits[1], prev[2], prev[3]]);
        setColSpinning(prev => [prev[0], false, prev[2], prev[3]]);
      }, 6000);
      const t2End = setTimeout(() => {
        setColStatuses(prev => [prev[0], "LISTO", prev[2], prev[3]]);
      }, 8000);

      // --- Column 3 (Decenas) ---
      // Spins at top speed for 8.0s, decelerates over 2.0s -> Locks exactly at 10.0s
      const t3Start = setTimeout(() => {
        setColTargets(prev => [prev[0], prev[1], baseRepetition + boletaDigits[2], prev[3]]);
        setColSpinning(prev => [prev[0], prev[1], false, prev[3]]);
      }, 8000);
      const t3End = setTimeout(() => {
        setColStatuses(prev => [prev[0], prev[1], "LISTO", prev[3]]);
      }, 10000);

      // --- Column 4 (Unidades) ---
      // Spins at top speed for 12.0s, decelerates over 2.0s -> Locks exactly at 14.0s
      const t4Start = setTimeout(() => {
        setColTargets(prev => [prev[0], prev[1], prev[2], baseRepetition + boletaDigits[3]]);
        setColSpinning(prev => [prev[0], prev[1], prev[2], false]);
      }, 12000);
      const t4End = setTimeout(() => {
        setColStatuses(prev => [prev[0], prev[1], prev[2], "LISTO"]);
        setIsSpinning(false);
        setShowWinnerCard(true);
      }, 14000);

      // Register all timeouts for cleanup
      timeoutRefs.current.push(
        t1Start, t1End,
        t2Start, t2End,
        t3Start, t3End,
        t4Start, t4End
      );

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Error al conectar con el servidor.");
      setIsSpinning(false);
      setColSpinning([false, false, false, false]);
      setColStatuses(["LISTO", "LISTO", "LISTO", "LISTO"]);
      // Reset numbers to 0
      setColTargets([1, 1, 1, 1]);
      setDigits([0, 0, 0, 0]);
    }
  };

  return (
    <div className="flex-1 bg-subtle min-h-screen flex flex-col justify-between py-6 px-4 font-sans antialiased relative">
      {/* CSS Keyframes for Fast Slot Reel Spin and Scale animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes scaleIn {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes spinReel {
          0% { transform: translateY(0); }
          100% { transform: translateY(-${10 * ROW_HEIGHT}px); }
        }
        .animate-scale-in {
          animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .animate-spin-reel {
          animation: spinReel 0.18s linear infinite;
        }
      `}} />

      {/* Decorative Brand Top Strip */}
      <div className="absolute top-0 left-0 w-full h-[6px] bg-gradient-to-r from-blue-primary via-green-nature to-orange-energy z-10" />

      {/* Header Back Arrow and Branding */}
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between mt-4">
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-border-default bg-canvas hover:bg-[#18668F]/5 text-blue-primary text-[13px] font-semibold rounded-lg shadow-sm transition-all active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Volver al Dashboard
        </Link>
        <span className="text-[10px] font-extrabold text-blue-primary bg-blue-primary/10 border border-blue-primary/20 px-3 py-1 rounded-full uppercase tracking-wider font-heading animate-pulse">
          Mesa de Control
        </span>
      </div>

      {/* Main Jackpot Stage Area */}
      <main className="w-full max-w-4xl mx-auto my-auto py-8 flex flex-col items-center">

        {/* Jackpot Institutional Branding Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <h1 className="font-heading text-[32px] md:text-[40px] font-extrabold text-ink-dark flex items-center gap-3.5 tracking-tight uppercase leading-none select-none">
            <span className="text-blue-primary">🎓</span>
            <span>Día del Estudiante</span>
            <span className="text-blue-primary">🎓</span>
          </h1>
          <p className="font-sans text-[15px] font-semibold text-ink-main mt-2 tracking-wide select-none">
            Institución Universitaria del Putumayo
          </p>
          <div className="w-20 h-[3px] bg-gradient-to-r from-blue-primary via-green-nature to-orange-energy rounded-full mt-3.5" />
        </div>

        {/* The Machine Case (Jackpot Container) */}
        <div className="w-full bg-canvas border border-border-default rounded-3xl shadow-[0_15px_40px_rgba(24,102,143,0.08)] p-6 md:p-10 flex flex-col md:flex-row items-center gap-8 md:gap-12 relative overflow-hidden select-none">
          {/* Subtle Background Glows */}
          <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-blue-primary/5 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-orange-energy/5 blur-3xl" />

          {/* Left Column: The 4 Reel Windows */}
          <div className="flex-1 w-full grid grid-cols-4 gap-3 md:gap-5 relative">

            {/* Horizontal Golden Highlight Frame (Perfect center alignment) */}
            <div className="absolute left-[-6px] right-[-6px] top-1/2 -translate-y-1/2 h-[84px] border-y-2 border-orange-energy bg-orange-energy/[0.04] pointer-events-none z-20 flex items-center justify-between px-1">
              <span className="w-2 h-2 rounded-full bg-orange-energy animate-ping" />
              <span className="w-2 h-2 rounded-full bg-orange-energy animate-ping" />
            </div>

            {/* Reel 1: Thousands */}
            <div className="flex flex-col items-center gap-4 z-10">
              <div className="w-full h-[240px] border border-border-default bg-subtle rounded-xl overflow-hidden relative shadow-[inset_0_4px_10px_rgba(0,0,0,0.06)]">
                <div
                  className={`w-full absolute top-0 left-0 flex flex-col items-center ${
                    colSpinning[0] ? "animate-spin-reel" : ""
                  }`}
                  style={{
                    transform: colSpinning[0] ? "none" : `translateY(-${(colTargets[0] - 1) * ROW_HEIGHT}px)`,
                    transition: colSpinning[0] ? "none" : "transform 2.0s cubic-bezier(0.12, 0.8, 0.3, 1)"
                  }}
                >
                  {DIGIT_SEQUENCE.map((num, i) => (
                    <div
                      key={i}
                      className={`h-[80px] flex items-center justify-center font-heading text-[48px] md:text-[56px] font-extrabold select-none transition-colors duration-300 ${(colTargets[0]) === i
                          ? "text-ink-dark scale-100 font-black"
                          : "text-ink-secondary/35 scale-90"
                        }`}
                    >
                      {num}
                    </div>
                  ))}
                </div>
              </div>
              {/* Indicator Lamp */}
              <div className={`px-3 py-1 rounded-full border text-[10px] font-bold tracking-wider uppercase transition-all duration-300 ${colStatuses[0] === "GIRANDO"
                  ? "bg-amber-50 border-amber-300 text-amber-600 shadow-[0_0_10px_rgba(245,165,29,0.2)] animate-pulse"
                  : "bg-green-50 border-green-200 text-green-nature shadow-[0_2px_4px_rgba(128,191,31,0.1)]"
                }`}>
                {colStatuses[0] === "GIRANDO" ? "⏳ GIRANDO" : "✓ LISTO"}
              </div>
            </div>

            {/* Reel 2: Hundreds */}
            <div className="flex flex-col items-center gap-4 z-10">
              <div className="w-full h-[240px] border border-border-default bg-subtle rounded-xl overflow-hidden relative shadow-[inset_0_4px_10px_rgba(0,0,0,0.06)]">
                <div
                  className={`w-full absolute top-0 left-0 flex flex-col items-center ${
                    colSpinning[1] ? "animate-spin-reel" : ""
                  }`}
                  style={{
                    transform: colSpinning[1] ? "none" : `translateY(-${(colTargets[1] - 1) * ROW_HEIGHT}px)`,
                    transition: colSpinning[1] ? "none" : "transform 2.0s cubic-bezier(0.12, 0.8, 0.3, 1)"
                  }}
                >
                  {DIGIT_SEQUENCE.map((num, i) => (
                    <div
                      key={i}
                      className={`h-[80px] flex items-center justify-center font-heading text-[48px] md:text-[56px] font-extrabold select-none transition-colors duration-300 ${(colTargets[1]) === i
                          ? "text-ink-dark scale-100 font-black"
                          : "text-ink-secondary/35 scale-90"
                        }`}
                    >
                      {num}
                    </div>
                  ))}
                </div>
              </div>
              {/* Indicator Lamp */}
              <div className={`px-3 py-1 rounded-full border text-[10px] font-bold tracking-wider uppercase transition-all duration-300 ${colStatuses[1] === "GIRANDO"
                  ? "bg-amber-50 border-amber-300 text-amber-600 shadow-[0_0_10px_rgba(245,165,29,0.2)] animate-pulse"
                  : "bg-green-50 border-green-200 text-green-nature shadow-[0_2px_4px_rgba(128,191,31,0.1)]"
                }`}>
                {colStatuses[1] === "GIRANDO" ? "⏳ GIRANDO" : "✓ LISTO"}
              </div>
            </div>

            {/* Reel 3: Tens */}
            <div className="flex flex-col items-center gap-4 z-10">
              <div className="w-full h-[240px] border border-border-default bg-subtle rounded-xl overflow-hidden relative shadow-[inset_0_4px_10px_rgba(0,0,0,0.06)]">
                <div
                  className={`w-full absolute top-0 left-0 flex flex-col items-center ${
                    colSpinning[2] ? "animate-spin-reel" : ""
                  }`}
                  style={{
                    transform: colSpinning[2] ? "none" : `translateY(-${(colTargets[2] - 1) * ROW_HEIGHT}px)`,
                    transition: colSpinning[2] ? "none" : "transform 2.0s cubic-bezier(0.12, 0.8, 0.3, 1)"
                  }}
                >
                  {DIGIT_SEQUENCE.map((num, i) => (
                    <div
                      key={i}
                      className={`h-[80px] flex items-center justify-center font-heading text-[48px] md:text-[56px] font-extrabold select-none transition-colors duration-300 ${(colTargets[2]) === i
                          ? "text-ink-dark scale-100 font-black"
                          : "text-ink-secondary/35 scale-90"
                        }`}
                    >
                      {num}
                    </div>
                  ))}
                </div>
              </div>
              {/* Indicator Lamp */}
              <div className={`px-3 py-1 rounded-full border text-[10px] font-bold tracking-wider uppercase transition-all duration-300 ${colStatuses[2] === "GIRANDO"
                  ? "bg-amber-50 border-amber-300 text-amber-600 shadow-[0_0_10px_rgba(245,165,29,0.2)] animate-pulse"
                  : "bg-green-50 border-green-200 text-green-nature shadow-[0_2px_4px_rgba(128,191,31,0.1)]"
                }`}>
                {colStatuses[2] === "GIRANDO" ? "⏳ GIRANDO" : "✓ LISTO"}
              </div>
            </div>

            {/* Reel 4: Units */}
            <div className="flex flex-col items-center gap-4 z-10">
              <div className="w-full h-[240px] border border-border-default bg-subtle rounded-xl overflow-hidden relative shadow-[inset_0_4px_10px_rgba(0,0,0,0.06)]">
                <div
                  className={`w-full absolute top-0 left-0 flex flex-col items-center ${
                    colSpinning[3] ? "animate-spin-reel" : ""
                  }`}
                  style={{
                    transform: colSpinning[3] ? "none" : `translateY(-${(colTargets[3] - 1) * ROW_HEIGHT}px)`,
                    transition: colSpinning[3] ? "none" : "transform 2.0s cubic-bezier(0.12, 0.8, 0.3, 1)"
                  }}
                >
                  {DIGIT_SEQUENCE.map((num, i) => (
                    <div
                      key={i}
                      className={`h-[80px] flex items-center justify-center font-heading text-[48px] md:text-[56px] font-extrabold select-none transition-colors duration-300 ${(colTargets[3]) === i
                          ? "text-ink-dark scale-100 font-black"
                          : "text-ink-secondary/35 scale-90"
                        }`}
                    >
                      {num}
                    </div>
                  ))}
                </div>
              </div>
              {/* Indicator Lamp */}
              <div className={`px-3 py-1 rounded-full border text-[10px] font-bold tracking-wider uppercase transition-all duration-300 ${colStatuses[3] === "GIRANDO"
                  ? "bg-amber-50 border-amber-300 text-amber-600 shadow-[0_0_10px_rgba(245,165,29,0.2)] animate-pulse"
                  : "bg-green-50 border-green-200 text-green-nature shadow-[0_2px_4px_rgba(128,191,31,0.1)]"
                }`}>
                {colStatuses[3] === "GIRANDO" ? "⏳ GIRANDO" : "✓ LISTO"}
              </div>
            </div>

          </div>

          {/* Right Column: Mechanical Jackpot Lever */}
          <div className="w-32 flex flex-col items-center justify-center gap-4 relative">
            <span className="text-[11px] font-bold text-ink-secondary uppercase tracking-wider select-none">
              Palanca
            </span>

            {/* Lever container */}
            <div className="h-40 w-16 flex items-start justify-center relative select-none">

              {/* Capsule Slot */}
              <div className="w-5 h-28 bg-slate-200 border border-slate-300 shadow-[inset_0_4px_8px_rgba(0,0,0,0.1)] rounded-full absolute top-6" />

              {/* Lever Stick Shaft */}
              <div
                onClick={handleSpin}
                className={`w-3.5 bg-gradient-to-r from-slate-400 via-slate-100 to-slate-400 absolute left-1/2 -translate-x-1/2 transition-all duration-300 origin-bottom cursor-pointer ${leverPulled
                    ? "h-16 top-16 scale-y-40"
                    : isSpinning
                      ? "h-24 top-6 opacity-70 cursor-not-allowed"
                      : "h-24 top-6 hover:shadow-lg active:scale-y-90"
                  }`}
                style={{
                  borderRadius: "2px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.15)"
                }}
              >
                {/* Red Circular Knob on Top */}
                <div
                  className={`w-8 h-8 rounded-full bg-gradient-to-tr from-red-700 via-red-500 to-red-300 absolute left-1/2 -translate-x-1/2 -top-6 shadow-[0_4px_10px_rgba(0,0,0,0.3)] transition-all ${leverPulled
                      ? "scale-95 bg-red-800"
                      : "hover:scale-105 hover:brightness-110 active:scale-95"
                    }`}
                  style={{
                    border: "1px solid rgba(0,0,0,0.2)"
                  }}
                />
              </div>

            </div>

            {/* Lever Spin Button Backup */}
            <button
              onClick={handleSpin}
              disabled={isSpinning}
              className={`w-full py-3 rounded-xl text-white font-heading text-[13px] font-bold shadow-md flex items-center justify-center gap-1.5 transition-all select-none cursor-pointer active:scale-95 ${isSpinning
                  ? "bg-slate-300 text-slate-500 shadow-none cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-primary to-orange-energy hover:from-blue-primary hover:to-orange-energy hover:shadow-lg"
                }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.706 9H17" />
              </svg>
              GIRAR RULETA
            </button>
          </div>

        </div>

        {/* Bottom Area: Winner card / Status bar */}
        <div className="w-full max-w-2xl mt-8 min-h-[120px] flex flex-col items-center justify-center relative">

          {/* Sorteando pulsing status */}
          {isSpinning && (
            <div className="flex flex-col items-center justify-center gap-2 select-none animate-pulse">
              <span className="text-[13px] font-semibold text-orange-energy tracking-widest uppercase font-heading">
                🎰 Mezclando boletas en vivo...
              </span>
              <p className="text-[11px] text-ink-secondary font-medium">
                Respetando el timing del jackpot.
              </p>
            </div>
          )}

          {/* Unactivated/No candidates warning banner */}
          {errorMsg && (
            <div className="w-full p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-[13.5px] leading-relaxed flex items-start gap-3 shadow-md animate-scale-in">
              <span className="text-[18px] leading-none mt-0.5">⚠️</span>
              <div>
                <span className="font-extrabold block text-[14px]">Operación Bloqueada</span>
                {errorMsg}
              </div>
            </div>
          )}

          {/* GORGEOUS WINNER PILL CARD REVEAL */}
          {showWinnerCard && winner && (
            <div className="w-full bg-[#80BF1F]/10 border-2 border-green-nature rounded-full px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_6px_25px_rgba(128,191,31,0.15)] animate-scale-in">

              {/* Winner Identity */}
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-green-nature/20 border border-green-nature/30 flex items-center justify-center text-xl shadow-inner">
                  🎉
                </div>
                <div className="text-center sm:text-left">
                  <span className="text-[10px] font-extrabold text-green-nature uppercase tracking-widest block font-heading">
                    ¡ESTUDIANTE GANADOR!
                  </span>
                  <span className="font-heading text-[18px] font-black text-ink-dark block mt-0.5">
                    {winner.nombre}
                  </span>
                </div>
              </div>

              {/* Winner Academic Details */}
              <div className="flex flex-wrap justify-center sm:justify-end gap-2.5">
                <span className="font-sans text-[12px] font-bold bg-blue-primary/15 text-blue-primary border border-blue-primary/10 px-3 py-1 rounded-full shadow-sm">
                  {winner.programa?.nombre || "General"}
                </span>
                <span className="font-mono text-[12px] font-bold bg-canvas border border-border-default text-ink-dark px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                  <span className="text-[10px] text-ink-secondary">Boleta:</span>
                  <span className="text-orange-energy font-black">{winner.boleta}</span>
                </span>
                <span className="font-sans text-[12px] font-bold bg-canvas border border-border-default text-ink-main px-3 py-1 rounded-full shadow-sm">
                  {winner.semestre?.numero ? `${winner.semestre.numero}° Semestre` : "N/A"}
                </span>
              </div>

            </div>
          )}

        </div>

      </main>

      {/* Footer copyright */}
      <footer className="w-full text-center py-2 select-none">
        <p className="text-[11px] text-ink-secondary/80 font-sans">
          © {new Date().getFullYear()} Institución Universitaria del Putumayo.
        </p>
        <p className="text-[9px] text-ink-secondary/60 font-sans mt-0.5">
          Panel de Sorteos Autorizado — Sistema de Seguridad NextAuth.
        </p>
      </footer>
    </div>
  );
}
