"use client"

import { Activity } from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"

export function Header() {
  const { data: session } = useSession()

  return (
    <header className="border-b bg-white shadow-sm w-full flex justify-center">
      <div className="container px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 ml-2">
              <Activity className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-blue-600">BRAÇOS ABERTOS</h1>
        </div>
            {session && (
              <div className="flex items-center gap-4">
                {session.user?.isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a href="/admin">Área Admin</a>
                  </Button>
                )}
                <span className="text-sm text-gray-600">
                  {session.user?.name}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                >
                  Sair
                </Button>
              </div>
            )}
      </div>
    </header>
  )
}

