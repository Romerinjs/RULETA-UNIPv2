"use client";

import { useState } from "react";
import Link from "next/link";
import CsvUpload from "./csv-upload";
import StudentList from "./student-list";

export default function DashboardClient() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      <CsvUpload onUploadSuccess={handleUploadSuccess} />
      
      <div className="bg-canvas p-6 rounded-lg border border-border-default shadow-[0_2px_6px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(24,102,143,0.1)] transition-shadow flex flex-col">
         <div className="flex items-center gap-3 mb-4">
           <div className="w-10 h-10 rounded-full bg-[#F5A51D]/15 flex items-center justify-center">
             <span className="text-orange-energy text-xl">🎡</span>
           </div>
           <h3 className="font-heading text-[18px] font-semibold text-ink-dark">Ruleta Institucional</h3>
         </div>
         <p className="font-sans text-[14px] text-ink-main mb-6 flex-grow">
           Inicia el sorteo en vivo en pantalla gigante. Se seleccionará aleatoriamente un ganador entre los estudiantes que marcaron asistencia.
         </p>
         <Link 
           href="/admin/ruleta" 
           className="w-full flex justify-center py-[10px] px-[24px] rounded-lg text-white font-sans text-[14px] font-semibold bg-gradient-to-br from-blue-primary to-orange-energy shadow-[0_4px_12px_rgba(24,102,143,0.2)] hover:opacity-90 transition-opacity mt-auto text-center"
         >
           Abrir Pantalla de Ruleta
         </Link>
      </div>

      <StudentList refreshTrigger={refreshTrigger} />
    </div>
  );
}
