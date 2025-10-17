import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase admin client with service role key
 * ONLY use this in server-side code for administrative operations
 *
 * SECURITY: This client bypasses Row Level Security (RLS)
 */

let adminClientInstance: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  // Prevent client-side usage
  if (typeof window !== 'undefined') {
    throw new Error('Supabase admin client cannot be used on the client side')
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('Missing Supabase admin credentials')
  }

  const normalizedKey = serviceRoleKey.toLowerCase()
  if (
    normalizedKey.includes('your_service_role_key') ||
    normalizedKey.includes('production-service-role-key')
  ) {
    throw new Error(
      'Invalid Supabase service role key detected. Update SUPABASE_SERVICE_ROLE_KEY with a real secret.'
    )
  }

  // Validate service role key format
  if (!serviceRoleKey.startsWith('eyJ')) {
    throw new Error('Invalid service role key format')
  }

  // Reuse instance for performance
  if (!adminClientInstance) {
    adminClientInstance = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: 'public',
      },
    })
  }

  return adminClientInstance
}

/**
 * Check if a user exists (admin operation)
 */
export async function adminCheckUserExists(userId: string): Promise<boolean> {
  const admin = getSupabaseAdmin()

  const { data, error } = await admin.from('users').select('id').eq('id', userId).maybeSingle()

  if (error) {
    console.error('Error checking user existence:', error)
    return false
  }

  return !!data
}

/**
 * Get user by email (admin operation)
 */
export async function adminGetUserByEmail(email: string) {
  const admin = getSupabaseAdmin()

  // Use listUsers with filter instead of getUserByEmail (not available in this version)
  const { data, error } = await admin.auth.admin.listUsers()

  if (error) {
    console.error('Error listing users:', error)
    return null
  }

  // Find user by email
  const user = data.users.find(u => u.email === email)
  return user || null
}

/**
 * Update user metadata (admin operation)
 */
export async function adminUpdateUserMetadata(userId: string, metadata: Record<string, any>) {
  const admin = getSupabaseAdmin()

  const { data, error } = await admin.auth.admin.updateUserById(userId, {
    user_metadata: metadata,
  })

  if (error) {
    throw new Error(`Failed to update user metadata: ${error.message}`)
  }

  return data
}
