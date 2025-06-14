"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, where, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Package, TrendingUp, Clock } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

export default function DailySales() {
  const { user } = useAuth()
  const [todaySales, setTodaySales] = useState([])
  const [totalSales, setTotalSales] = useState(0)
  const [totalItems, setTotalItems] = useState(0)

  useEffect(() => {
    if (user) {
      fetchTodaySales()
    }
  }, [user])

  const fetchTodaySales = async () => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const q = query(
        collection(db, "sales"),
        where("salespersonId", "==", user.uid),
        where("createdAt", ">=", today),
        orderBy("createdAt", "desc"),
      )

      const querySnapshot = await getDocs(q)
      const salesList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      setTodaySales(salesList)

      // Calculate totals
      const total = salesList.reduce((sum, sale) => sum + sale.totalAmount, 0)
      const items = salesList.reduce(
        (sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
        0,
      )

      setTotalSales(total)
      setTotalItems(items)
    } catch (error) {
      console.error("Error fetching today's sales:", error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalSales.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Sold</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaySales.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Sales List */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Sales</CardTitle>
        </CardHeader>
        <CardContent>
          {todaySales.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No sales recorded today</p>
          ) : (
            <div className="space-y-4">
              {todaySales.map((sale) => (
                <div key={sale.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {sale.createdAt?.toDate?.()?.toLocaleTimeString() || "N/A"}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">${sale.totalAmount?.toFixed(2)}</div>
                      <Badge variant="outline">{sale.paymentMethod === "cash" ? "Cash" : "Digital"}</Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {sale.items?.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>
                          {item.name} x{item.quantity}
                        </span>
                        <span>${item.total?.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
