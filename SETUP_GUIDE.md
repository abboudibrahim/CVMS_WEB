# CVMS Setup Guide

## Prerequisites
- Node.js (LTS version 18.x or 20.x recommended)
- Firebase project with Firestore enabled
- Git (optional, for version control)

## 1. Environment Setup

### Install Dependencies
```bash
cd C:\Projects\CVMS\CVMS_WEB
npm install
```

### Environment Variables
The `.env` file has been created with your Firebase configuration. Make sure it contains:
```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

## 2. Firebase Configuration

### Enable Authentication
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Authentication > Sign-in method
4. Enable Email/Password authentication

### Create Initial Admin User
1. Go to Authentication > Users
2. Click "Add user"
3. Create an admin user with email/password
4. Note the UID of this user

### Set Up Firestore Collections
The app will automatically create these collections on first run:
- `users` - User accounts and roles
- `vouchers` - Voucher data
- `restaurants` - Restaurant list
- `airlines` - Airline list
- `tax` - Tax settings

### Create Admin User Document
In Firestore, create a document in the `users` collection:
```json
{
  "uid": "your_admin_user_uid",
  "email": "admin@yourcompany.com",
  "role": "admin",
  "createdAt": "timestamp"
}
```

## 3. Security Rules (Important!)

### Firestore Security Rules
Replace your Firestore rules with these:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Only authenticated users can access vouchers
    match /vouchers/{voucherId} {
      allow read, write: if request.auth != null;
    }
    
    // Only authenticated users can access restaurants
    match /restaurants/{restaurantId} {
      allow read, write: if request.auth != null;
    }
    
    // Only authenticated users can access airlines
    match /airlines/{airlineId} {
      allow read, write: if request.auth != null;
    }
    
    // Only authenticated users can access tax settings
    match /tax/{taxId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 4. Running the Application

### Development Mode
```bash
npm start
```
This will open http://localhost:3000

### Production Build
```bash
npm run build
```

## 5. First Login

1. Open the application in your browser
2. Use the admin email/password you created in Firebase
3. The app will automatically load initial data

## 6. Troubleshooting

### Common Issues

1. **Authentication Error**: Make sure Firebase Auth is enabled and the user exists
2. **Permission Denied**: Check Firestore security rules
3. **Environment Variables**: Ensure `.env` file is in the correct location
4. **Port Already in Use**: Change port with `PORT=3001 npm start`

### Debug Mode
To see detailed error messages, open browser DevTools (F12) and check the Console tab.

## 7. Features Overview

### Admin Features
- Manage restaurants and airlines
- View all vouchers
- Generate invoices
- Access aging reports

### User Features
- Create and manage vouchers
- Filter and search vouchers
- Generate invoices
- View aging reports

## 8. Next Steps

1. **Test the application** thoroughly
2. **Create additional users** as needed
3. **Customize the UI** if desired
4. **Set up monitoring** for production use
5. **Configure backup** for Firestore data

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify Firebase configuration
3. Ensure all dependencies are installed
4. Check network connectivity
