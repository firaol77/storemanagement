"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Store, Loader2 } from "lucide-react"

export default function LoginForm() {
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
      // Dynamically import Firebase to ensure it's only loaded on client side
      const { signInWithEmailAndPassword } = await import("firebase/auth")
      const { doc, getDoc } = await import("firebase/firestore")
      const { auth, db } = await import("@/lib/firebase")

      if (!auth) {
        throw new Error("Firebase auth is not initialized")
      }

      console.log("Attempting login for:", email)
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      console.log("Login successful for:", userCredential.user.email)

      // Check if user document exists and redirect immediately
      if (db) {
        const userDocRef = doc(db, "users", userCredential.user.uid)
        const userDoc = await getDoc(userDocRef)

        if (!userDoc.exists()) {
          console.error("User document not found")
          setError("User profile not found. Please contact your administrator.")
          setLoading(false)
          return
        }

        const userData = userDoc.data()
        console.log("User document found:", userData)

        // Immediate redirect based on role
        switch (userData.role) {
          case "super_admin":
            console.log("Redirecting to super-admin")
            router.push("/super-admin")
            break
          case "admin":
            console.log("Redirecting to admin")
            router.push("/admin")
            break
          case "salesperson":
            console.log("Redirecting to salesperson")
            router.push("/salesperson")
            break
          default:
            setError("Unknown user role")
            setLoading(false)
        }
      }

      // Don't set loading to false here - let the redirect happen
    } catch (error) {
      console.error("Login error:", error)
      setError(error.message || "Failed to login")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary rounded-full p-3">
              <Store className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Store Manager</CardTitle>
          <CardDescription>Sign in to manage your store</CardDescription>
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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
            <div className="text-center mt-4">
              <Button variant="link" onClick={() => router.push("/salesperson-login")} className="text-sm">
                Salesperson? Click here to login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
