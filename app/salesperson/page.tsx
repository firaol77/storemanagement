"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Navbar from "@/components/layout/navbar"
import SalesInterface from "@/components/salesperson/sales-interface"
import DailySales from "@/components/salesperson/daily-sales"

export default function SalespersonPage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const initializePage = async () => {
      try {
        const { auth } = await import("@/lib/firebase")
        const { onAuthStateChanged } = await import("firebase/auth")

        if (!auth) {
          router.push("/")
          return
        }

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
          if (!currentUser) {
            router.push("/")
            return
          }

          try {
            const { doc, getDoc } = await import("firebase/firestore")
            const { db } = await import("@/lib/firebase")

            if (db) {
              const userDocRef = doc(db, "users", currentUser.uid)
              const userDoc = await getDoc(userDocRef)

              if (userDoc.exists()) {
                const userData = userDoc.data()

                if (userData.role !== "salesperson") {
                  router.push("/")
                  return
                }

                setUser(userData)
              } else {
                router.push("/")
                return
              }
            }
          } catch (error) {
            console.error("Error verifying user:", error)
            router.push("/")
            return
          }

          setLoading(false)
        })

        return () => unsubscribe()
      } catch (error) {
        console.error("Error initializing page:", error)
        router.push("/")
      }
    }

    initializePage()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading Sales Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Sales Dashboard" />

      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome, {user?.name || "Salesperson"}!</h1>
          <p className="text-gray-600">Start making sales and track your performance.</p>
        </div>

        <Tabs defaultValue="sales" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sales">Make Sales</TabsTrigger>
            <TabsTrigger value="daily">Daily Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="sales">
            <SalesInterface />
          </TabsContent>

          <TabsContent value="daily">
            <DailySales />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
