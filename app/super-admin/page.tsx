"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createUserWithEmailAndPassword, signOut } from "firebase/auth"
import { collection, getDocs, query, where, doc, writeBatch, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Plus, Store, Users, Loader2, MoreHorizontal, UserX, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Navbar from "@/components/layout/navbar"

export default function SuperAdminPage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [admins, setAdmins] = useState([])
  const [createLoading, setCreateLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    storeName: "",
  })
  const router = useRouter()

  useEffect(() => {
    const initializePage = async () => {
      try {
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

            if (db) {
              const userDocRef = doc(db, "users", currentUser.uid)
              const userDoc = await getDoc(userDocRef)

              if (userDoc.exists()) {
                const userData = userDoc.data()

                if (userData.role !== "super_admin") {
                  router.push("/")
                  return
                }

                setUser(userData)
                await fetchAdmins()
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

  const fetchAdmins = async () => {
    try {
      const q = query(collection(db, "users"), where("role", "==", "admin"))
      const querySnapshot = await getDocs(q)
      const adminsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setAdmins(adminsList)
    } catch (error) {
      console.error("Error fetching admins:", error)
    }
  }

  const handleCreateAdmin = async (e) => {
    e.preventDefault()
    setCreateLoading(true)
    setError("")
    setSuccess("")

    // Store current user to restore session
    const currentUser = auth.currentUser

    try {
      // Create authentication account first
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password)
      const newUserUid = userCredential.user.uid

      console.log("Created user with UID:", newUserUid)

      // Immediately sign out the new user to prevent auto-login
      await signOut(auth)

      // Create user document in Firestore using the actual UID as document ID
      await setDoc(doc(db, "users", newUserUid), {
        uid: newUserUid,
        name: formData.name,
        email: formData.email,
        role: "admin",
        storeName: formData.storeName,
        status: "active",
        createdAt: new Date(),
        createdBy: user?.uid,
      })

      // Re-authenticate the super admin
      if (currentUser) {
        // Force refresh the auth state to restore super admin session
        await auth.updateCurrentUser(currentUser)
      }

      setSuccess(`Admin created successfully! Email: ${formData.email}, Password: ${formData.password}`)
      setFormData({ name: "", email: "", password: "", storeName: "" })
      fetchAdmins()
    } catch (error) {
      console.error("Error creating admin:", error)
      setError(`Failed to create admin: ${error.message}`)

      // Try to restore super admin session if something went wrong
      if (currentUser) {
        try {
          await auth.updateCurrentUser(currentUser)
        } catch (restoreError) {
          console.error("Error restoring session:", restoreError)
        }
      }
    } finally {
      setCreateLoading(false)
    }
  }

  const toggleAdminStatus = async (adminId, adminUid, currentStatus) => {
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active"
      const batch = writeBatch(db)

      // Update admin status
      const adminRef = doc(db, "users", adminId)
      batch.update(adminRef, { status: newStatus })

      // Update all salespersons created by this admin
      const salespersonsQuery = query(
        collection(db, "users"),
        where("adminId", "==", adminUid),
        where("role", "==", "salesperson"),
      )
      const salespersonsSnapshot = await getDocs(salespersonsQuery)

      salespersonsSnapshot.docs.forEach((userDoc) => {
        const userRef = doc(db, "users", userDoc.id)
        batch.update(userRef, { status: newStatus })
      })

      await batch.commit()
      fetchAdmins()
      setSuccess(`Admin and all associated salespersons ${newStatus === "active" ? "activated" : "deactivated"}`)
    } catch (error) {
      setError("Error updating status: " + error.message)
    }
  }

  const deleteAdmin = async (adminId, adminUid) => {
    if (!confirm("Are you sure? This will delete the admin and all salespersons created by them.")) return

    try {
      const batch = writeBatch(db)

      // Get all salespersons created by this admin
      const salespersonsQuery = query(
        collection(db, "users"),
        where("adminId", "==", adminUid),
        where("role", "==", "salesperson"),
      )
      const salespersonsSnapshot = await getDocs(salespersonsQuery)

      // Delete all associated salespersons from Firestore
      salespersonsSnapshot.docs.forEach((userDoc) => {
        const userRef = doc(db, "users", userDoc.id)
        batch.delete(userRef)
      })

      // Delete admin from Firestore
      const adminRef = doc(db, "users", adminId)
      batch.delete(adminRef)

      await batch.commit()
      fetchAdmins()
      setSuccess("Admin and all associated salespersons deleted successfully")
    } catch (error) {
      setError("Error deleting admin: " + error.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading Super Admin Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Super Admin Dashboard" />

      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome, {user?.name || "Super Admin"}!</h1>
          <p className="text-gray-600">Manage your store administrators and system settings.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Stores</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{admins.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Admins</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{admins.filter((admin) => admin.status === "active").length}</div>
            </CardContent>
          </Card>
        </div>

        {(error || success) && (
          <div className="mb-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Store Admins */}
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Store Administrators</CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Admin
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Store Admin</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateAdmin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Admin Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storeName">Store Name</Label>
                    <Input
                      id="storeName"
                      value={formData.storeName}
                      onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={createLoading}>
                    {createLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Admin"
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Store Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell>{admin.name}</TableCell>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell>{admin.storeName}</TableCell>
                    <TableCell>
                      <Badge variant={admin.status === "active" ? "default" : "destructive"}>
                        {admin.status || "active"}
                      </Badge>
                    </TableCell>
                    <TableCell>{admin.createdAt?.toDate?.()?.toLocaleDateString() || "N/A"}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() => toggleAdminStatus(admin.id, admin.uid, admin.status || "active")}
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            {admin.status === "active" ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => deleteAdmin(admin.id, admin.uid)} className="text-red-600">
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
      </div>
    </div>
  )
}
