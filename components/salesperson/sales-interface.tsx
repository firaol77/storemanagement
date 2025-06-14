"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, where, addDoc, updateDoc, doc, increment } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, ShoppingCart, Plus, Minus, Package } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import ImageRecognition from "./image-recognition"

export default function SalesInterface() {
  const { user, userData } = useAuth()
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [cart, setCart] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [paymentOptions, setPaymentOptions] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (userData?.adminId) {
      fetchItems()
      fetchCategories()
      fetchPaymentOptions()
    }
  }, [userData])

  const fetchItems = async () => {
    try {
      const q = query(collection(db, "items"), where("adminId", "==", userData.adminId))
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
    try {
      const q = query(collection(db, "categories"), where("adminId", "==", userData.adminId))
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

  const fetchPaymentOptions = async () => {
    try {
      const q = query(collection(db, "paymentOptions"), where("adminId", "==", userData.adminId))
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

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || item.categoryId === selectedCategory
    return matchesSearch && matchesCategory && item.quantity > 0
  })

  const addToCart = (item) => {
    const existingItem = cart.find((cartItem) => cartItem.id === item.id)
    if (existingItem) {
      if (existingItem.quantity < item.quantity) {
        setCart(
          cart.map((cartItem) =>
            cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem,
          ),
        )
      }
    } else {
      setCart([...cart, { ...item, quantity: 1 }])
    }
  }

  const updateCartQuantity = (itemId, change) => {
    setCart(
      cart
        .map((cartItem) => {
          if (cartItem.id === itemId) {
            const newQuantity = cartItem.quantity + change
            if (newQuantity <= 0) {
              return null
            }
            const maxQuantity = items.find((item) => item.id === itemId)?.quantity || 0
            return { ...cartItem, quantity: Math.min(newQuantity, maxQuantity) }
          }
          return cartItem
        })
        .filter(Boolean),
    )
  }

  const removeFromCart = (itemId) => {
    setCart(cart.filter((cartItem) => cartItem.id !== itemId))
  }

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const handleSale = async (paymentMethod = "cash") => {
    if (cart.length === 0) return

    setLoading(true)
    try {
      // Create sale record
      const saleData = {
        items: cart.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          total: item.price * item.quantity,
        })),
        totalAmount: getTotalAmount(),
        paymentMethod,
        salespersonId: user.uid,
        salespersonName: userData.name,
        adminId: userData.adminId,
        createdAt: new Date(),
      }

      await addDoc(collection(db, "sales"), saleData)

      // Update item quantities
      for (const cartItem of cart) {
        const itemRef = doc(db, "items", cartItem.id)
        await updateDoc(itemRef, {
          quantity: increment(-cartItem.quantity),
        })
      }

      // Clear cart and refresh items
      setCart([])
      fetchItems()
      alert("Sale completed successfully!")
    } catch (error) {
      console.error("Error completing sale:", error)
      alert("Error completing sale: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleItemFound = (recognizedItem) => {
    // Find the actual item in our inventory
    const foundItem = items.find(
      (item) =>
        item.name.toLowerCase().includes(recognizedItem.name.toLowerCase()) || item.code === recognizedItem.code,
    )

    if (foundItem) {
      addToCart(foundItem)
    }
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Store Inventory
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search items by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <ImageRecognition onItemFound={handleItemFound} />
          </div>

          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-auto">
              <TabsTrigger value="all">All Items</TabsTrigger>
              {categories.map((category) => (
                <TabsTrigger key={category.id} value={category.id}>
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items Grid */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl || "/placeholder.svg"}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">{item.name}</h3>
                    <p className="text-xs text-gray-600">Code: {item.code}</p>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-green-600">${item.price?.toFixed(2)}</span>
                      <Badge variant={item.quantity > 10 ? "default" : "destructive"}>{item.quantity} left</Badge>
                    </div>
                    <Button onClick={() => addToCart(item)} className="w-full" size="sm" disabled={item.quantity === 0}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Shopping Cart */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Shopping Cart ({cart.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Cart is empty</p>
              ) : (
                <>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 p-2 border rounded">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-gray-600">${item.price} each</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="outline" onClick={() => updateCartQuantity(item.id, -1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <Button size="sm" variant="outline" onClick={() => updateCartQuantity(item.id, 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button size="sm" variant="destructive" onClick={() => removeFromCart(item.id)}>
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-bold">Total:</span>
                      <span className="font-bold text-lg text-green-600">${getTotalAmount().toFixed(2)}</span>
                    </div>

                    <div className="space-y-2">
                      <Button onClick={() => handleSale("cash")} className="w-full" disabled={loading}>
                        Complete Sale (Cash)
                      </Button>

                      {paymentOptions.length > 0 && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="w-full">
                              Digital Payment
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Choose Payment Method</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-3">
                              {paymentOptions.map((option) => (
                                <Card key={option.id} className="p-4">
                                  <div className="space-y-2">
                                    <h4 className="font-medium">{option.bankName}</h4>
                                    <p className="text-sm text-gray-600">Account: {option.accountName}</p>
                                    <p className="text-sm text-gray-600">Number: {option.accountNumber}</p>
                                    <Button
                                      onClick={() => handleSale(`bank_${option.id}`)}
                                      className="w-full"
                                      disabled={loading}
                                    >
                                      Pay via {option.bankName}
                                    </Button>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
