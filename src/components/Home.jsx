import { ArrowRight, BarChart2, Clock, Server, Shield } from "lucide-react"
import { Link } from "react-router-dom"

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                  M
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-semibold text-gray-900">Log Monitoring System</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/logs"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md mb-8">
          <div className="px-6 py-12 sm:px-12 sm:py-16 lg:py-20 lg:px-16">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl lg:text-5xl">
                Sistema de Monitoreo de Logs con Rate Limiting
              </h2>
              <p className="mt-4 text-xl text-gray-500">
                Análisis comparativo entre servidores con y sin limitación de tasa de solicitudes
              </p>
              <div className="mt-8 flex justify-center">
                <Link
                  to="/logs"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Ver Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Student and Teacher Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md p-6">
            <div className="flex items-center mb-4">
              <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h3 className="ml-3 text-xl font-semibold text-gray-900">Alumno</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-start">
                <span className="flex-shrink-0 text-sm font-medium text-gray-500 w-20">Nombre:</span>
                <span className="text-sm text-gray-900">Hugo Alberto Miralrio Espinoza</span>
              </div>
              <div className="flex items-start">
                <span className="flex-shrink-0 text-sm font-medium text-gray-500 w-20">Grado:</span>
                <span className="text-sm text-gray-900">8° Cuatrimestre</span>
              </div>
              <div className="flex items-start">
                <span className="flex-shrink-0 text-sm font-medium text-gray-500 w-20">Grupo:</span>
                <span className="text-sm text-gray-900">IDGS11-A</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md p-6">
            <div className="flex items-center mb-4">
              <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                  />
                </svg>
              </div>
              <h3 className="ml-3 text-xl font-semibold text-gray-900">Docente</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-start">
                <span className="flex-shrink-0 text-sm font-medium text-gray-500 w-20">Nombre: Emmanuel Martínez Hernández</span>
                <span className="text-sm text-gray-900"></span>
              </div>
              <div className="flex items-start">
                <span className="flex-shrink-0 text-sm font-medium text-gray-500 w-20">Grado:</span>
                <span className="text-sm text-gray-900">Ingenieria en desarrollo y gestion de software.</span>
              </div>
              <div className="flex items-start">
                <span className="flex-shrink-0 text-sm font-medium text-gray-500 w-20">Materia:</span>
                <span className="text-sm text-gray-900">Seguridad en desarrollo de aplicaciones</span>
              </div>
            </div>
          </div>
        </div>

        {/* Project Description */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md mb-8">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Descripción del Proyecto</h3>
          </div>
          <div className="p-6">
            <p className="text-gray-700 mb-6">
              Esta aplicación implementa un sistema de monitoreo de logs con dos servidores para analizar y comparar el
              comportamiento de sistemas con y sin limitación de tasa de solicitudes (Rate Limiting).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-indigo-50 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Server className="h-5 w-5 text-indigo-600 mr-2" />
                  <h4 className="text-base font-medium text-indigo-700">Servidor 1: Con Rate Limiting</h4>
                </div>
                <p className="text-sm text-indigo-900">
                  Implementa un mecanismo de limitación de tasa que controla el número de solicitudes que pueden ser
                  procesadas en un período de tiempo determinado.
                </p>
              </div>

              <div className="bg-emerald-50 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Server className="h-5 w-5 text-emerald-600 mr-2" />
                  <h4 className="text-base font-medium text-emerald-700">Servidor 2: Sin Rate Limiting</h4>
                </div>
                <p className="text-sm text-emerald-900">
                  Procesa todas las solicitudes sin restricciones, permitiendo comparar el rendimiento y comportamiento
                  con el servidor que implementa Rate Limiting.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <BarChart2 className="h-5 w-5 text-gray-600 mr-2" />
                  <h4 className="text-sm font-medium text-gray-700">Análisis Comparativo</h4>
                </div>
                <p className="text-xs text-gray-600">
                  Visualización de métricas clave para comparar el rendimiento entre ambos servidores.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Clock className="h-5 w-5 text-gray-600 mr-2" />
                  <h4 className="text-sm font-medium text-gray-700">Monitoreo en Tiempo Real</h4>
                </div>
                <p className="text-xs text-gray-600">
                  Seguimiento continuo de tiempos de respuesta, códigos de estado y uso de recursos.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Shield className="h-5 w-5 text-gray-600 mr-2" />
                  <h4 className="text-sm font-medium text-gray-700">Seguridad y Protección</h4>
                </div>
                <p className="text-xs text-gray-600">
                  Evaluación de cómo el Rate Limiting puede proteger contra ataques de denegación de servicio.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="px-6 py-12 sm:px-12 sm:py-16 lg:flex lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
                <span className="block">¿Listo para explorar los datos?</span>
              </h2>
              <p className="mt-4 text-lg leading-6 text-indigo-100">
                Accede al dashboard para visualizar y analizar el comportamiento de ambos servidores.
              </p>
            </div>
            <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
              <div className="inline-flex rounded-md shadow">
                <Link
                  to="/logs"
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50"
                >
                  Ver Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-1">
              <div className="h-6 w-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded flex items-center justify-center text-white text-xs font-bold">
                M
              </div>
              <span className="text-sm text-gray-500">Sistema de Monitoreo de Logs</span>
            </div>
            <div className="mt-4 md:mt-0 text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Hugo Alberto Miralrio Espinoza - IDGS11-A
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home

