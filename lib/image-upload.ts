// Updated Cloudinary upload with your cloud name
export const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("upload_preset", "store_management") // You'll need to create this preset
  formData.append("cloud_name", "dsngihcnu") // Your cloud name

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/dsngihcnu/image/upload`, {
      method: "POST",
      body: formData,
    })

    const data = await response.json()
    return data.secure_url
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error)
    throw error
  }
}

// Alternative: Use your API key (requires upload preset)
export const uploadToCloudinaryWithKey = async (file: File): Promise<string> => {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("api_key", "473134869372634")
  formData.append("upload_preset", "store_management")

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/dsngihcnu/image/upload`, {
      method: "POST",
      body: formData,
    })

    const data = await response.json()
    return data.secure_url
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error)
    throw error
  }
}

// Enhanced version with more options
export const uploadToCloudinaryEnhanced = async (
  file: File,
  options?: {
    folder?: string
    transformation?: string
    tags?: string[]
  },
): Promise<string> => {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("upload_preset", "store_management")
  formData.append("cloud_name", "dsngihcnu")

  // Add optional parameters
  if (options?.folder) {
    formData.append("folder", options.folder)
  }
  if (options?.tags) {
    formData.append("tags", options.tags.join(","))
  }

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/dsngihcnu/image/upload`, {
      method: "POST",
      body: formData,
    })

    const data = await response.json()
    return data.secure_url
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error)
    throw error
  }
}
