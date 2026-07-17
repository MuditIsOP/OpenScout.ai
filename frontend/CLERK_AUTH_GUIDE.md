# Clerk Auth Integration Guide

This document outlines the minimal requirements for integrating Clerk authentication into the frontend. Since you are rebuilding the UI from scratch, here is what you need to preserve and implement.

## 1. Environment Variables
Ensure your `frontend/.env.local` contains the following keys. These are already generated and active for this project:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
```

## 2. Global Provider
You must wrap the Next.js application in the `<ClerkProvider>` so that all routes have access to the auth context.

In `frontend/app/layout.tsx`:
```tsx
import { ClerkProvider } from '@clerk/nextjs'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
```

## 3. Calling the Backend API (Important!)
Our FastAPI backend relies on Clerk JWTs for authentication. Every authenticated request to the backend must include the user's token in the `Authorization` header.

You can retrieve this token asynchronously using Clerk's `useAuth()` hook in client components, or `auth()` in server components.

**Client Component Example:**
```tsx
'use client';
import { useAuth } from '@clerk/nextjs';

export function FetchDashboard() {
  const { getToken } = useAuth();

  const loadData = async () => {
    // 1. Get the raw JWT string
    const token = await getToken();
    
    // 2. Pass it in the Authorization header
    const response = await fetch('http://localhost:8000/api/dashboard', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    console.log(data);
  };
  
  return <button onClick={loadData}>Load Dashboard</button>;
}
```

## 4. User Synchronization
You do **not** need to manually send user data (like email or github username) to the backend when they sign up. 
The backend has a dedicated Clerk webhook (`POST /api/auth/webhook/clerk`) that listens for user creations/updates and automatically syncs them into our MongoDB database. 

Simply use the standard Clerk `<SignIn />` and `<SignUp />` components.
