"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Users, Package, BarChart3, CreditCard } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Navbar from "@/components/layout/navbar"
import UserManagement from "@/components/admin/user-management"
import ItemManagement from "@/components/admin/item-management"
import CategoryManagement from "@/components/admin/category-management"
import SalesReports from "@/components/admin/sales-reports"
import PaymentOptions from "@/components/admin/payment-options"

export default function AdminPage() {
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

                if (userData.role !== "admin") {
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
          <p className="text-gray-600">Loading Admin Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Admin Dashboard" />

      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome, {user?.name || "Admin"}!</h1>
          <p className="text-gray-600">Manage your store operations and team.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Salespersons</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0.00</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0.00</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="items">Items</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="items">
            <ItemManagement />
          </TabsContent>

          <TabsContent value="categories">
            <CategoryManagement />
          </TabsContent>

          <TabsContent value="reports">
            <SalesReports />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentOptions />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
