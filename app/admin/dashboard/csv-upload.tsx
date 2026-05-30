"use client";

import { useState, useRef, useEffect } from "react";
import Papa from "papaparse";
import { toast } from "react-toastify";
import { UploadCloud, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface EstudianteRow {
  nombre: string;
  documento: string;
  boleta: string;
  programaId: string | number;
  semestreId: string | number;
  grupoId: string | number;
}

export default function CsvUpload({ onUploadSuccess }: { onUploadSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);

    Papa.parse<EstudianteRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const response = await fetch("/api/admin/estudiantes/bulk", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ estudiantes: results.data }),
          });

          const data = await response.json();

          if (!response.ok) {
            toast.error(data.error || "Ocurrió un error al cargar el archivo");
            return;
          }

          if (data.success) {
            toast.success(`Carga completada: ${data.insertados} insertados, ${data.omitidos} omitidos.`);
            
            if (data.errores && data.errores.length > 0) {
              toast.warn(`Hubo ${data.errores.length} errores en filas (Revisa la consola para más detalles)`);
              console.warn("Errores de carga:", data.errores);
            }
            
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
            onUploadSuccess();
          } else {
            toast.error("Error al procesar los datos.");
          }
        } catch (error) {
          console.error("Upload error:", error);
          toast.error("Error de conexión al cargar el archivo.");
        } finally {
          setLoading(false);
        }
      },
      error: (error) => {
        toast.error(`Error al leer el CSV: ${error.message}`);
        setLoading(false);
      }
    });
  };

  return (
    <div className="bg-canvas p-6 rounded-lg border border-border-default shadow-[0_2px_6px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(24,102,143,0.1)] transition-shadow">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-[#80BF1F]/15 flex items-center justify-center">
          <UploadCloud className="text-green-nature w-5 h-5" />
        </div>
        <h3 className="font-heading text-[18px] font-semibold text-ink-dark">Carga Masiva (CSV)</h3>
      </div>
      
      <p className="font-sans text-[14px] text-ink-main mb-6">
        Sube el listado de estudiantes permitidos para participar en el sorteo. Asegúrate de que el archivo tenga las columnas: 
        <code className="bg-subtle px-1 mx-1 rounded text-ink-dark text-[12px]">nombre, documento, boleta, programaId, semestreId, grupoId</code>.
      </p>

      <div className="relative">
        <input 
          type="file" 
          accept=".csv" 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileUpload}
          disabled={loading}
          ref={fileInputRef}
        />
        <button 
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 py-[10px] px-[24px] rounded-lg text-white font-sans text-[14px] font-semibold bg-blue-primary shadow-[0_4px_12px_rgba(24,102,143,0.2)] hover:bg-blue-hover transition-colors disabled:opacity-50"
        >
          {loading ? (
             <><Loader2 className="w-4 h-4 animate-spin" /> Procesando CSV...</>
          ) : (
            <><UploadCloud className="w-4 h-4" /> Seleccionar y Cargar Archivo</>
          )}
        </button>
      </div>
    </div>
  );
}
