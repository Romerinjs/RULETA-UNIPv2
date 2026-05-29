"use client";

import { useEffect, useState } from "react";
import { Search, ChevronLeft, ChevronRight, User } from "lucide-react";

interface Estudiante {
  id: string;
  nombre: string;
  documento: string;
  boleta: string;
  telefono: string | null;
  asistencia: boolean;
  ganador: boolean;
  programa: { nombre: string };
  semestre: { numero: number };
  grupo: { nombre: string };
}

export default function StudentList({ refreshTrigger }: { refreshTrigger: number }) {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchEstudiantes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/estudiantes?page=${page}&limit=10&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      
      if (data.success) {
        setEstudiantes(data.data);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEstudiantes();
  }, [page, search, refreshTrigger]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1); // Reset page on new search
  };

  return (
    <div className="bg-canvas p-6 rounded-lg border border-border-default shadow-[0_2px_6px_rgba(0,0,0,0.05)] col-span-1 md:col-span-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="font-heading text-[18px] font-semibold text-ink-dark">Estudiantes Registrados</h3>
          <p className="font-sans text-[14px] text-ink-main">Total: {total} estudiantes en la base de datos.</p>
        </div>
        
        <div className="relative max-w-sm w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-ink-secondary" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-border-default rounded-md leading-5 bg-white placeholder-ink-secondary focus:outline-none focus:ring-1 focus:ring-blue-primary focus:border-blue-primary sm:text-sm"
            placeholder="Buscar por nombre, documento o boleta..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border-default">
          <thead className="bg-subtle">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-ink-main uppercase tracking-wider">Nombre</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-ink-main uppercase tracking-wider">Boleta / Doc</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-ink-main uppercase tracking-wider">Programa</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-ink-main uppercase tracking-wider">Semestre / Grupo</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-ink-main uppercase tracking-wider">Asistencia</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-border-default">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-ink-main">
                  Cargando...
                </td>
              </tr>
            ) : estudiantes.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-ink-main">
                  No se encontraron estudiantes.
                </td>
              </tr>
            ) : (
              estudiantes.map((est) => (
                <tr key={est.id} className="hover:bg-subtle/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-primary" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-ink-dark">{est.nombre}</div>
                        <div className="text-xs text-ink-secondary">{est.telefono || "Sin teléfono"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-ink-dark font-medium font-mono">{est.boleta}</div>
                    <div className="text-xs text-ink-secondary">{est.documento}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-primary/10 text-blue-primary">
                      {est.programa?.nombre}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-ink-main">
                    Sem. {est.semestre?.numero} - {est.grupo?.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {est.asistencia ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-nature/15 text-[#5c8f12]">
                        Presente
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-energy/15 text-[#c48011]">
                        Ausente
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-ink-main">
            Página <span className="font-medium text-ink-dark">{page}</span> de <span className="font-medium text-ink-dark">{totalPages}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 border border-border-default rounded-md disabled:opacity-50 hover:bg-subtle transition-colors text-ink-dark"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 border border-border-default rounded-md disabled:opacity-50 hover:bg-subtle transition-colors text-ink-dark"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
