"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import LoginForm from "@/components/auth/login-form"

export default function HomePage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [redirecting, setRedirecting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return

    // Check for redirect from 404 page
    const checkRedirect = () => {
      const redirectPath = sessionStorage.getItem("redirectPath")
      if (redirectPath) {
        sessionStorage.removeItem("redirectPath")
        // Only redirect to valid paths
        if (
          redirectPath.includes("/super-admin") ||
          redirectPath.includes("/admin") ||
          redirectPath.includes("/salesperson")
        ) {
          console.log("Found redirect path:", redirectPath)
          // We'll handle this after auth check
        }
      }
    }

    const checkAuth = async () => {
      try {
        // Dynamically import Firebase to ensure it's only loaded on client side
        const { auth } = await import("@/lib/firebase")
        const { onAuthStateChanged } = await import("firebase/auth")
        const { doc, getDoc } = await import("firebase/firestore")
        const { db } = await import("@/lib/firebase")

        if (!auth) {
          console.error("Auth is not initialized")
          setLoading(false)
          return
        }

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
          console.log("Auth state changed:", currentUser?.email || "No user")

          if (currentUser) {
            setUser(currentUser)

            try {
              // Check if user document exists
              if (db) {
                const userDocRef = doc(db, "users", currentUser.uid)
                const userDoc = await getDoc(userDocRef)

                if (userDoc.exists()) {
                  const userData = userDoc.data()
                  console.log("User data:", userData)

                  // Set redirecting state
                  setRedirecting(true)

                  // Check for redirect from 404 page
                  const redirectPath = sessionStorage.getItem("redirectPath")
                  let targetPath = null

                  // Determine where to redirect based on role
                  switch (userData.role) {
                    case "super_admin":
                      targetPath = "/super-admin"
                      break
                    case "admin":
                      targetPath = "/admin"
                      break
                    case "salesperson":
                      targetPath = "/salesperson"
                      break
                    default:
                      console.log("Unknown role:", userData.role)
                      setLoading(false)
                      setRedirecting(false)
                      return
                  }

                  // If we have a redirect path and it matches the user's role, use that
                  if (redirectPath && redirectPath.startsWith(targetPath)) {
                    console.log("Redirecting to:", redirectPath)
                    router.push(redirectPath)
                  } else {
                    console.log("Redirecting to:", targetPath)
                    router.push(targetPath)
                  }
                } else {
                  console.log("No user document found")
                  setLoading(false)
                }
              }
            } catch (error) {
              console.error("Error fetching user data:", error)
              setLoading(false)
            }
          } else {
            setUser(null)
            setLoading(false)
          }
        })

        return () => unsubscribe()
      } catch (error) {
        console.error("Error in auth check:", error)
        setLoading(false)
      }
    }

    checkRedirect()
    checkAuth()
  }, [router])

  if (loading || redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{redirecting ? "Redirecting..." : "Loading..."}</p>
        </div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    )
  }

  return <LoginForm />
}
