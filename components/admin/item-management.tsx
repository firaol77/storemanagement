"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { collection, addDoc, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Package } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { uploadToCloudinary } from "@/lib/image-upload"

export default function ItemManagement() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    categoryId: "",
    quantity: "",
    picture: null as File | null,
  })

  useEffect(() => {
    fetchItems()
    fetchCategories()
  }, [user])

  const fetchItems = async () => {
    if (!user) return

    try {
      const q = query(collection(db, "items"), where("adminId", "==", user.uid))
      const querySnapshot = await getDocs(q)
      const itemsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setItems(itemsList)
    } catch (error) {
      console.error("Error fetching items:", error)
    }
  }

  const fetchCategories = async () => {
    if (!user) return

    try {
      const q = query(collection(db, "categories"), where("adminId", "==", user.uid))
      const querySnapshot = await getDocs(q)
      const categoriesList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setCategories(categoriesList)
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const generateItemCode = (categoryName: string, itemName: string) => {
    const categoryCode = categoryName.substring(0, 3).toUpperCase()
    const itemCode = itemName.substring(0, 3).toUpperCase()
    const randomNum = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")
    return `${categoryCode}${itemCode}${randomNum}`
  }

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const selectedCategory = categories.find((cat) => cat.id === formData.categoryId)
      const itemCode = generateItemCode(selectedCategory?.name || "GEN", formData.name)

      let imageUrl = ""
      if (formData.picture) {
        try {
          // Option 1: Use Cloudinary (recommended)
          imageUrl = await uploadToCloudinary(formData.picture)

          // Option 2: Use ImgBB (alternative)
          // imageUrl = await uploadToImgBB(formData.picture)

          // Option 3: Convert to base64 (for small images only)
          // imageUrl = await convertToBase64(formData.picture)
        } catch (error) {
          console.error("Error uploading image:", error)
          // Continue without image if upload fails
        }
      }

      await addDoc(collection(db, "items"), {
        name: formData.name,
        price: Number.parseFloat(formData.price),
        categoryId: formData.categoryId,
        categoryName: selectedCategory?.name || "",
        quantity: Number.parseInt(formData.quantity),
        code: itemCode,
        imageUrl,
        adminId: user?.uid,
        createdAt: new Date(),
      })

      setFormData({ name: "", price: "", categoryId: "", quantity: "", picture: null })
      fetchItems()
      alert("Item created successfully!")
    } catch (error: any) {
      console.error("Error creating item:", error)
      alert("Error creating item: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Items Management</CardTitle>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateItem} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category: any) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="picture">Item Picture</Label>
                <Input
                  id="picture"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, picture: e.target.files?.[0] || null })}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating..." : "Create Item"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item: any) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl || "/placeholder.svg"}
                        alt={item.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Package className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.code}</TableCell>
                <TableCell>{item.categoryName}</TableCell>
                <TableCell>${item.price?.toFixed(2)}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>
                  <Badge variant={item.quantity > 0 ? "default" : "destructive"}>
                    {item.quantity > 0 ? "In Stock" : "Out of Stock"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
