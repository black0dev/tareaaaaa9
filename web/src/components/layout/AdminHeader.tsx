"use client";

import { useAuth } from "@/lib/auth-context";

export default function AdminHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Panel de Administración
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">{user?.email}</span>
            {user?.name && <span> ({user.name})</span>}
          </div>
          <button
            onClick={logout}
            className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  );
}
