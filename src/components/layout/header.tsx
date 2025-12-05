import { Activity, CheckCircle2, XCircle } from "lucide-react"

export function Header() {
  return (
    <header className="border-b bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-gray-700">UBS</span>
              <div className="flex gap-1">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                  S
                </span>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-100 text-xs font-bold text-yellow-700">
                  P
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-blue-600">BRAÇOS ABERTOS</h1>
          </div>
        </div>
      </div>
    </header>
  )
}

