"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Clock, Settings, LogOut, Menu } from "lucide-react"
import Link from "next/link"

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<{ name: string; role: string } | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Check if user is logged in
    const userStr = localStorage.getItem("user")
    if (!userStr) {
      router.push("/")
      return
    }

    try {
      const userData = JSON.parse(userStr)
      setUser(userData)

      // Load access settings to check permissions
      const savedSettings = localStorage.getItem("accessSettings")
      if (savedSettings) {
        const accessSettings = JSON.parse(savedSettings)

        // If user is not admin and dashboard access is disabled, redirect to attendance
        if (userData.role !== "admin" && !accessSettings.allowEmployeeDashboardAccess && pathname === "/dashboard") {
          router.push("/attendance")
        }
      }
    } catch (e) {
      localStorage.removeItem("user")
      router.push("/")
    }
  }, [router, pathname])

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/")
  }

  if (!user) {
    return null // Or a loading spinner
  }

  const navigation = [
    ...(user?.role === "admin" ||
    JSON.parse(localStorage.getItem("accessSettings") || '{"allowEmployeeDashboardAccess": true}')
      .allowEmployeeDashboardAccess
      ? [{ name: "Dashboard", href: "/dashboard", icon: LayoutDashboard }]
      : []),
    { name: "Absensi", href: "/attendance", icon: Clock },
    ...(user?.role === "admin" ? [{ name: "Pengaturan", href: "/settings", icon: Settings }] : []),
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile menu */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between bg-white p-4 shadow">
          <h1 className="text-xl font-bold">Sistem Absensi</h1>
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <Menu />
          </Button>
        </div>

        {isMobileMenuOpen && (
          <div className="absolute z-10 w-full bg-white shadow-lg">
            <div className="p-4 border-b">
              <p className="font-medium">{user.name}</p>
            </div>
            <nav className="flex flex-col">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm ${
                    pathname === item.href ? "bg-gray-100 text-blue-600" : "text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Logout
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-grow flex-col overflow-y-auto border-r border-gray-200 bg-white pt-5">
          <div className="flex flex-shrink-0 items-center px-4">
            <h1 className="text-xl font-bold">Sistem Absensi</h1>
          </div>
          <div className="mt-5 flex flex-grow flex-col">
            <nav className="flex-1 space-y-1 px-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center rounded-md px-2 py-2 text-sm font-medium ${
                    pathname === item.href ? "bg-gray-100 text-blue-600" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex flex-shrink-0 border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-gray-700">{user.name}</p>
                <p className="text-xs text-gray-500">{user.role === "admin" ? "Administrator" : "Pegawai"}</p>
              </div>
              <Button variant="ghost" size="icon" className="ml-auto" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="py-6 px-4 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
