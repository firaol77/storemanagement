"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, CreditCard, Trash2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

export default function PaymentOptions() {
  const { user } = useAuth()
  const [paymentOptions, setPaymentOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    bankName: "",
    accountName: "",
    accountNumber: "",
  })

  useEffect(() => {
    fetchPaymentOptions()
  }, [user])

  const fetchPaymentOptions = async () => {
    if (!user) return

    try {
      const q = query(collection(db, "paymentOptions"), where("adminId", "==", user.uid))
      const querySnapshot = await getDocs(q)
      const optionsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setPaymentOptions(optionsList)
    } catch (error) {
      console.error("Error fetching payment options:", error)
    }
  }

  const handleCreatePaymentOption = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await addDoc(collection(db, "paymentOptions"), {
        bankName: formData.bankName,
        accountName: formData.accountName,
        accountNumber: formData.accountNumber,
        adminId: user?.uid,
        createdAt: new Date(),
      })

      setFormData({ bankName: "", accountName: "", accountNumber: "" })
      fetchPaymentOptions()
      alert("Payment option added successfully!")
    } catch (error: any) {
      console.error("Error creating payment option:", error)
      alert("Error creating payment option: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePaymentOption = async (id: string) => {
    if (confirm("Are you sure you want to delete this payment option?")) {
      try {
        await deleteDoc(doc(db, "paymentOptions", id))
        fetchPaymentOptions()
      } catch (error) {
        console.error("Error deleting payment option:", error)
      }
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Payment Options</CardTitle>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Payment Option
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Payment Option</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreatePaymentOption} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  placeholder="Enter bank name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountName">Account Name</Label>
                <Input
                  id="accountName"
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  placeholder="Enter account holder name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  placeholder="Enter account number"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Adding..." : "Add Payment Option"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Icon</TableHead>
              <TableHead>Bank Name</TableHead>
              <TableHead>Account Name</TableHead>
              <TableHead>Account Number</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paymentOptions.map((option: any) => (
              <TableRow key={option.id}>
                <TableCell>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-green-600" />
                  </div>
                </TableCell>
                <TableCell className="font-medium">{option.bankName}</TableCell>
                <TableCell>{option.accountName}</TableCell>
                <TableCell>{option.accountNumber}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => handleDeletePaymentOption(option.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
