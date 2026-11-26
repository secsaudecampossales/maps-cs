"use client"

import { Activity, ChevronDown, LogOut } from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useEffect, useState } from "react"
import Link from "next/link"

const INACTIVITY_LIMIT_SECONDS = 15 * 60
const ACTIVITY_EVENTS = ["click", "keydown", "scroll", "touchstart", "mousemove"] as const

export function Header() {
  const { data: session } = useSession()
  const [remainingSeconds, setRemainingSeconds] = useState(INACTIVITY_LIMIT_SECONDS)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!session) return

    const resetTimer = () => setRemainingSeconds(INACTIVITY_LIMIT_SECONDS)

    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, resetTimer, { passive: true })
    })

    const intervalId = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          signOut({ callbackUrl: "/login" })
          return INACTIVITY_LIMIT_SECONDS
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, resetTimer)
      })
      window.clearInterval(intervalId)
    }
  }, [session])

  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60
  const sessionWarning = remainingSeconds <= 60

  return (
    <header className="w-full bg-gradient-to-r from-blue-700 via-sky-600 to-sky-700 shadow-md">
      <div className="container px-4 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 shadow-sm">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="text-lg md:text-xl font-semibold tracking-tight text-white truncate">
              MAPS-CS
            </h1>
            <span className="text-[11px] md:text-xs text-sky-100/95 truncate">
              APS Campos Sales
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 md:gap-3">
          <ThemeToggle className="bg-white/10 hover:bg-white/20 text-white" />

          {session && (
            <div className="flex items-center gap-2 md:gap-4">
              <div
                className={`hidden sm:flex flex-col items-end leading-tight rounded-md px-2 py-1 ${
                  sessionWarning ? "bg-amber-500/20 animate-pulse" : ""
                }`}
                aria-live="polite"
                aria-label={`Sessão encerra em ${minutes} minutos e ${seconds} segundos`}
              >
                <span className="text-[10px] text-blue-100/80">Sessão encerra em</span>
                <span className="text-xs font-mono text-white">
                  {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
                </span>
              </div>

              {session.user?.isAdmin && (
                <div className="hidden md:flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    asChild
                    className="bg-white/15 text-white border-white/20 hover:bg-white/25"
                  >
                    <Link href="/admin">Área Admin</Link>
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    asChild
                    className="bg-white/15 text-white border-white/20 hover:bg-white/25"
                  >
                    <Link href="/admin/relatorios">Relatórios</Link>
                  </Button>
                </div>
              )}

              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMenuOpen((o) => !o)}
                  className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white gap-1 max-w-[140px] md:max-w-none"
                >
                  <span className="truncate hidden sm:inline">{session.user?.name}</span>
                  <ChevronDown className="h-4 w-4 shrink-0" />
                </Button>

                {menuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setMenuOpen(false)}
                      aria-hidden="true"
                    />
                    <div className="absolute right-0 top-full mt-1 z-50 w-56 rounded-lg border bg-white dark:bg-card dark:border-border shadow-lg py-1 text-gray-900 dark:text-foreground">
                      <div className="px-3 py-2 border-b dark:border-border">
                        <p className="text-sm font-medium truncate">{session.user?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {session.user?.isAdmin ? "Administrador" : "Profissional de Saúde"}
                        </p>
                      </div>
                      {session.user?.isAdmin && (
                        <>
                          <Link
                            href="/admin"
                            className="block px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-secondary/70 md:hidden"
                            onClick={() => setMenuOpen(false)}
                          >
                            Área Admin
                          </Link>
                          <Link
                            href="/admin/relatorios"
                            className="block px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-secondary/70 md:hidden"
                            onClick={() => setMenuOpen(false)}
                          >
                            Relatórios
                          </Link>
                        </>
                      )}
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                        onClick={() => signOut({ callbackUrl: "/login" })}
                      >
                        <LogOut className="h-4 w-4" />
                        Sair
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
