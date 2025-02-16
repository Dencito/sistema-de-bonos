export default function Guest({ children }) {
    return (
        <div className="min-h-screen flex flex-col sm:justify-center items-center pt-6 sm:pt-0 bg-gradient-to-br from-cyan-50 via-white to-blue-50">
            <div className="mb-8">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                    Sistema de Bonos
                </h1>
            </div>

            {children}
        </div>
    );
}
