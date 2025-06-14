"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, User } from "lucide-react"

export default function SalespersonLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { signInWithEmailAndPassword } = await import("firebase/auth")
      const { doc, getDoc } = await import("firebase/firestore")
      const { auth, db } = await import("@/lib/firebase")

      if (!auth) {
        throw new Error("Firebase auth is not initialized")
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password)

      if (db) {
        const userDocRef = doc(db, "users", userCredential.user.uid)
        const userDoc = await getDoc(userDocRef)

        if (!userDoc.exists()) {
          setError("User profile not found. Please contact your administrator.")
          setLoading(false)
          return
        }

        const userData = userDoc.data()

        if (userData.role !== "salesperson") {
          setError("This login is only for salespersons. Please use the main login.")
          setLoading(false)
          return
        }

        if (userData.status !== "active") {
          setError("Your account has been deactivated. Please contact your administrator.")
          setLoading(false)
          return
        }

        router.push("/salesperson")
      }
    } catch (error) {
      console.error("Login error:", error)
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        setError("Invalid email or password")
      } else if (error.code === "auth/invalid-email") {
        setError("Please enter a valid email address")
      } else {
        setError(error.message || "Failed to login")
      }
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-green-600 rounded-full p-3">
              <User className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Salesperson Login</CardTitle>
          <CardDescription>Sign in to start making sales</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>

            <div className="text-center">
              <Button variant="link" onClick={() => router.push("/")} className="text-sm">
                Admin/Super Admin Login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
