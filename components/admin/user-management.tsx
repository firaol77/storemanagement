"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc } from "firebase/firestore"
import { createUserWithEmailAndPassword, signOut } from "firebase/auth" // Fixed import
import { uploadToCloudinary } from "@/lib/image-upload"
import { db, auth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, MoreHorizontal, UserX, Trash2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

export default function UserManagement() {
  const { user } = useAuth()
  const [salespersons, setSalespersons] = useState([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    picture: null as File | null,
  })

  useEffect(() => {
    fetchSalespersons()
  }, [user])

  const fetchSalespersons = async () => {
    if (!user) return

    try {
      const q = query(collection(db, "users"), where("role", "==", "salesperson"), where("adminId", "==", user.uid))
      const querySnapshot = await getDocs(q)
      const salespersonsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setSalespersons(salespersonsList)
    } catch (error) {
      console.error("Error fetching salespersons:", error)
    }
  }

  const generateUsername = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, "").substring(0, 5)
  }

  const handleCreateSalesperson = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const username = generateUsername(formData.name)
      const password = `${username}123`

      let pictureUrl = ""
      if (formData.picture) {
        try {
          pictureUrl = await uploadToCloudinary(formData.picture)
        } catch (error) {
          console.error("Error uploading image:", error)
        }
      }

      try {
        // Store current user to restore session later
        const currentUser = auth.currentUser

        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, password)

        // Sign out the newly created user immediately
        await signOut(auth)

        // Create user document
        await addDoc(collection(db, "users"), {
          uid: userCredential.user.uid,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          username,
          pictureUrl,
          role: "salesperson",
          status: "active",
          adminId: user?.uid,
          createdAt: new Date(),
        })

        // Restore admin session
        if (currentUser) {
          await auth.updateCurrentUser(currentUser)
        }

        setFormData({ name: "", email: "", phone: "", picture: null })
        fetchSalespersons()
        alert(
          `Salesperson created successfully!\n\nLogin Details:\nEmail: ${formData.email}\nPassword: ${password}\n\nThey can login at: ${window.location.origin}/salesperson-login`,
        )
      } catch (error: any) {
        console.error("Error creating salesperson:", error)
        let errorMessage = "Error creating salesperson: "

        if (error.code === "auth/email-already-in-use") {
          errorMessage += "This email is already registered"
        } else if (error.code === "auth/weak-password") {
          errorMessage += "Password is too weak"
        } else if (error.code === "auth/invalid-email") {
          errorMessage += "Invalid email address"
        } else {
          errorMessage += error.message
        }

        alert(errorMessage)
      }
    } catch (error: any) {
      console.error("Error creating salesperson:", error)
      alert("Error creating salesperson: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active"
      await updateDoc(doc(db, "users", userId), { status: newStatus })
      fetchSalespersons()
    } catch (error) {
      console.error("Error updating user status:", error)
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return

    try {
      await deleteDoc(doc(db, "users", userId))
      fetchSalespersons()
    } catch (error) {
      console.error("Error deleting user:", error)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Salespersons Management</CardTitle>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Salesperson
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Salesperson</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSalesperson} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email address"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="picture">Profile Picture</Label>
                <Input
                  id="picture"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, picture: e.target.files?.[0] || null })}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating..." : "Create Salesperson"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Picture</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {salespersons.map((person: any) => (
              <TableRow key={person.id}>
                <TableCell>
                  <Avatar>
                    <AvatarImage src={person.pictureUrl || "/placeholder.svg"} />
                    <AvatarFallback>{person.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell>{person.name}</TableCell>
                <TableCell>{person.username}</TableCell>
                <TableCell>{person.phone}</TableCell>
                <TableCell>{person.email}</TableCell>
                <TableCell>
                  <Badge variant={person.status === "active" ? "default" : "destructive"}>
                    {person.status || "active"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => toggleUserStatus(person.id, person.status || "active")}>
                        <UserX className="mr-2 h-4 w-4" />
                        {person.status === "active" ? "Deactivate" : "Activate"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => deleteUser(person.id)} className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
