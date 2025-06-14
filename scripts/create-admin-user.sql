-- Create admin user document in Firestore
-- You need to run this manually in Firebase Console > Firestore Database

-- Collection: users
-- Document ID: Use the UID from Firebase Authentication for tsegabto7@gmail.com

-- Document data:
{
  "uid": "REPLACE_WITH_ACTUAL_UID_FROM_AUTH",
  "email": "tsegabto7@gmail.com", 
  "name": "Admin User",
  "role": "admin",
  "status": "active",
  "storeName": "Main Store",
  "createdAt": "2024-06-12T00:00:00.000Z",
  "createdBy": "SUPER_ADMIN_UID"
}

-- Note: Replace REPLACE_WITH_ACTUAL_UID_FROM_AUTH with the actual UID from Firebase Authentication
-- Replace SUPER_ADMIN_UID with the UID of the super admin who created this admin
