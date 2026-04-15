"use client";

import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <Link
              href="/login"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 font-medium"
            >
              Cerrar Sesión
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-12 px-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Métricas Cards */}
          <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Pacientes Totales</h3>
            <p className="text-3xl font-bold text-gray-900">1,234</p>
          </div>
          <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Citas Hoy</h3>
            <p className="text-3xl font-bold text-indigo-600">56</p>
          </div>
          <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Alertas</h3>
            <p className="text-3xl font-bold text-red-600">3</p>
          </div>

          {/* Gráficos Placeholder */}
          <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200 sm:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Gráfico de Tendencias</h3>
            <div className="h-64 bg-gray-100 rounded-md flex items-center justify-center">
              <p className="text-gray-500">Placeholder para gráfico</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
