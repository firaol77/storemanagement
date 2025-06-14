"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Camera, Upload } from "lucide-react"

interface ImageRecognitionProps {
  onItemFound: (item: any) => void
}

export default function ImageRecognition({ onItemFound }: ImageRecognitionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedImage(file)
    }
  }

  const recognizeItem = async () => {
    if (!selectedImage) return

    setLoading(true)
    try {
      // This is a placeholder for actual image recognition
      // In a real implementation, you would use a service like Google Vision API
      // or a custom ML model to recognize items from images

      // For demo purposes, we'll simulate finding an item
      setTimeout(() => {
        const mockItem = {
          id: "demo-item",
          name: "Recognized Item",
          price: 25.99,
          code: "REC001",
          quantity: 10,
        }
        onItemFound(mockItem)
        setIsOpen(false)
        setSelectedImage(null)
        setLoading(false)
        alert("Item recognized and added to cart!")
      }, 2000)
    } catch (error) {
      console.error("Error recognizing item:", error)
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Camera className="mr-2 h-4 w-4" />
          Scan Item
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Scan Item with Camera</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            {selectedImage ? (
              <div>
                <img
                  src={URL.createObjectURL(selectedImage) || "/placeholder.svg"}
                  alt="Selected item"
                  className="max-w-full h-48 object-contain mx-auto mb-4"
                />
                <p className="text-sm text-gray-600">{selectedImage.name}</p>
              </div>
            ) : (
              <div>
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600">Upload an image to recognize the item</p>
              </div>
            )}
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1">
              Choose Image
            </Button>
            <Button onClick={recognizeItem} disabled={!selectedImage || loading} className="flex-1">
              {loading ? "Recognizing..." : "Recognize Item"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
