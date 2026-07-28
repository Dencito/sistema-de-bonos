/**
 * Encabezado consistente para todas las páginas: título, bajada y acciones.
 * Las acciones bajan solas debajo del título cuando no entran a lo ancho.
 */
export default function PageHeader({ title, subtitle, icon: Icon, actions, children }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
      <div className="flex items-start min-w-0 gap-3">
        {Icon && (
          <div className="flex items-center justify-center rounded-lg w-11 h-11 bg-slate-900 shrink-0">
            <Icon className="w-5 h-5 text-white" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-xl font-bold leading-tight sm:text-2xl text-slate-900">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
          {children}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
