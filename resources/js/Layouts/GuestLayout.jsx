export default function Guest({ children }) {
  return (
    <div className="min-h-screen flex flex-col sm:justify-center items-center pt-6 sm:pt-0 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-200 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <div className="relative w-full sm:max-w-md mt-6 px-6 py-8 bg-white/80 backdrop-blur-sm shadow-xl overflow-hidden sm:rounded-2xl border border-white/20">
        {children}
      </div>
    </div>
  );
}
