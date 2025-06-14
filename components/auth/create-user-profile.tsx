"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function CreateUserProfile() {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const createUserProfile = async () => {
    setLoading(true)
    setMessage("")

    try {
      const { signInWithEmailAndPassword } = await import("firebase/auth")
      const { collection, addDoc, query, where, getDocs } = await import("firebase/firestore")
      const { auth, db } = await import("@/lib/firebase")

      if (!auth || !db) {
        throw new Error("Firebase not initialized")
      }

      // First, get the user's UID by signing them in temporarily
      const userCredential = await signInWithEmailAndPassword(auth, email, "temporary")
      const uid = userCredential.user.uid

      // Check if user document already exists
      const q = query(collection(db, "users"), where("uid", "==", uid))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        setMessage("User profile already exists!")
        return
      }

      // Create user document
      await addDoc(collection(db, "users"), {
        uid: uid,
        name: name,
        email: email,
        role: "super_admin",
        createdAt: new Date(),
      })

      setMessage("User profile created successfully!")
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mt-4">
      <CardHeader>
        <CardTitle>Create User Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="profileEmail">Email (from Firebase Auth)</Label>
          <Input
            id="profileEmail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter the email from Firebase Auth"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profileName">Full Name</Label>
          <Input
            id="profileName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter full name"
          />
        </div>
        {message && (
          <Alert>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        <Button onClick={createUserProfile} disabled={loading} className="w-full">
          {loading ? "Creating..." : "Create User Profile"}
        </Button>
      </CardContent>
    </Card>
  )
}
