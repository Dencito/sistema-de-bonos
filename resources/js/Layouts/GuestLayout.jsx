import { Banknote } from 'lucide-react';

/**
 * Pantalla partida: a la izquierda la marca, a la derecha el formulario.
 * En pantallas chicas el panel de marca se reemplaza por un encabezado compacto.
 */
export default function Guest({ children }) {
  return (
    <div className="flex min-h-screen bg-white">
      <aside className="relative hidden overflow-hidden lg:flex lg:w-2/5 xl:w-1/2 bg-slate-900">
        {/* Halos de fondo, puramente decorativos */}
        <div
          aria-hidden="true"
          className="absolute rounded-full -top-32 -left-24 w-96 h-96 bg-slate-700/40 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute rounded-full -bottom-40 -right-16 w-96 h-96 bg-emerald-500/10 blur-3xl"
        />

        <div className="relative flex flex-col justify-between w-full p-10 xl:p-14">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 bg-white rounded-xl">
              <Banknote className="w-6 h-6 text-slate-900" />
            </div>
            <span className="text-lg font-bold text-white">Sistema de Caja</span>
          </div>

          <div className="max-w-md">
            <h2 className="text-3xl font-bold leading-tight text-white xl:text-4xl">
              Control de caja, turnos y pasilleras en un solo lugar.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-400">
              Seguimiento de saldos en tiempo real, cierre de turno con arqueo y trazabilidad de
              cada movimiento por sucursal.
            </p>
          </div>

          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} · Todos los derechos reservados
          </p>
        </div>
      </aside>

      <main className="flex flex-col items-center justify-center flex-1 px-6 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-center gap-3 mb-10 lg:hidden">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900">
              <Banknote className="w-5 h-5 text-white" />
            </div>
            <span className="text-base font-bold text-slate-900">Sistema de Caja</span>
          </div>

          {children}
        </div>
      </main>
    </div>
  );
}
