"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, where, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useAuth } from "@/hooks/use-auth"

export default function SalesReports() {
  const { user } = useAuth()
  const [sales, setSales] = useState([])
  const [salesData, setSalesData] = useState([])
  const [selectedPeriod, setSelectedPeriod] = useState("7")

  useEffect(() => {
    if (user) {
      fetchSales()
    }
  }, [user, selectedPeriod])

  const fetchSales = async () => {
    if (!user) return

    try {
      const salesQuery = query(collection(db, "sales"), where("adminId", "==", user.uid), orderBy("createdAt", "desc"))
      const salesSnapshot = await getDocs(salesQuery)
      const salesList = salesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      setSales(salesList)
      processSalesData(salesList)
    } catch (error) {
      console.error("Error fetching sales:", error)
    }
  }

  const processSalesData = (salesList: any[]) => {
    const days = Number.parseInt(selectedPeriod)
    const dateMap = new Map()

    // Initialize date map
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toLocaleDateString()
      dateMap.set(dateStr, { date: dateStr, sales: 0, count: 0 })
    }

    // Process sales data
    salesList.forEach((sale) => {
      const saleDate = sale.createdAt?.toDate?.()?.toLocaleDateString()
      if (saleDate && dateMap.has(saleDate)) {
        const dayData = dateMap.get(saleDate)
        dayData.sales += sale.totalAmount || 0
        dayData.count += 1
      }
    })

    setSalesData(Array.from(dateMap.values()))
  }

  const totalSales = sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0)
  const averageSale = sales.length > 0 ? totalSales / sales.length : 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSales.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sales.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Average Sale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${averageSale.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Sales Analytics</CardTitle>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sales" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Salesperson</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.slice(0, 10).map((sale: any) => (
                <TableRow key={sale.id}>
                  <TableCell>{sale.createdAt?.toDate?.()?.toLocaleDateString() || "N/A"}</TableCell>
                  <TableCell>{sale.salespersonName || "Admin"}</TableCell>
                  <TableCell>{sale.items?.length || 0} items</TableCell>
                  <TableCell>${sale.totalAmount?.toFixed(2) || "0.00"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
