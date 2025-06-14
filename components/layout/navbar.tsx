"use client"

import { Button } from "@/components/ui/button"
import { Store, LogOut, User } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"

interface NavbarProps {
  title: string
}

export default function Navbar({ title }: NavbarProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      const { signOut } = await import("firebase/auth")
      const { auth } = await import("@/lib/firebase")

      if (auth) {
        await signOut(auth)
        router.push("/")
      }
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary rounded-lg p-2">
            <Store className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}
