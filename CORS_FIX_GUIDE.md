# CORS Error Fix Guide

## Issue
Getting CORS error when trying to sign up: "Cross-Origin Request Blocked"

## ✅ Solution: Switch to Official Supabase Client (RECOMMENDED)

You already have `@supabase/supabase-js` installed! The custom client is causing CORS issues.

### Quick Fix:

1. **Backup the current client** (optional):
   ```bash
   cp src/utils/supabase/client.ts src/utils/supabase/client_custom_backup.ts
   ```

2. **Replace the custom client** with the official one:
   - The file `src/utils/supabase/client_official.ts` has been created
   - Replace the contents of `src/utils/supabase/client.ts` with the official implementation

3. **Or manually update** `src/utils/supabase/client.ts`:
   ```typescript
   import { createClient as createSupabaseClient } from '@supabase/supabase-js';
   import { projectId, publicAnonKey } from './info';
   import type { Database } from './client';

   const supabaseUrl = `https://${projectId}.supabase.co`;

   export function createClient() {
     return createSupabaseClient<Database>(supabaseUrl, publicAnonKey, {
       auth: {
         autoRefreshToken: true,
         persistSession: true,
         detectSessionInUrl: true
       }
     });
   }
   ```

4. **Keep the Database type definition** - You can keep the `Database` type at the top of the file or import it separately.

### Why This Works:
- ✅ Official client handles CORS automatically
- ✅ Better error handling
- ✅ Full Supabase feature support
- ✅ Automatic token refresh
- ✅ Session persistence

---

## Alternative Solution 1: Configure CORS in Supabase Dashboard

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/mnkyaakbizxydtgulugu
   - Go to **Settings** → **API**

2. **Add Your Local Development URL**
   - Under **CORS Configuration** or **Additional Allowed Origins**
   - Add: `http://localhost:3000` (or whatever port you're using)
   - Add: `http://localhost:5173` (if using Vite)
   - Add: `http://127.0.0.1:3000`
   - Click **Save**

3. **If CORS settings aren't visible**
   - Supabase automatically allows common origins
   - The issue might be with the custom client implementation
   - Try Solution 2 below

## Solution 2: Use Official Supabase Client (Best Practice)

The current implementation uses a custom Supabase client. The official `@supabase/supabase-js` client handles CORS automatically.

### Install Official Client:
```bash
npm install @supabase/supabase-js
```

### Update `src/utils/supabase/client.ts`:

Replace the custom implementation with:

```typescript
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

const supabaseUrl = `https://${projectId}.supabase.co`;

export function createClient() {
  return createSupabaseClient<Database>(supabaseUrl, publicAnonKey);
}
```

This will automatically handle CORS and all Supabase features properly.

## Solution 3: Quick Fix - Add CORS Mode to Fetch

If you want to keep the custom client, update the `signUp` method in `client.ts`:

```typescript
signUp: async ({ email, password, options }: { email: string; password: string; options?: any }) => {
  try {
    const response = await fetch(`${this.url}/auth/v1/signup`, {
      method: 'POST',
      mode: 'cors', // Add this
      credentials: 'include', // Add this
      headers: {
        'apikey': this.key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        data: options?.data ?? {}
      }),
    });
    // ... rest of code
  }
}
```

## Recommended Action

**Use Solution 2** - Install and use the official Supabase client. It's:
- ✅ Better maintained
- ✅ Handles CORS automatically
- ✅ Has all Supabase features
- ✅ Better error handling
- ✅ TypeScript support

The custom client might be missing important features and proper CORS handling.

