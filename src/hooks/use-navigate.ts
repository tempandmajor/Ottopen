import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

interface NavigationOptions {
  replace?: boolean
  timeout?: number
}

export function useNavigate() {
  const router = useRouter()

  const navigate = useCallback(
    async (path: string, options: NavigationOptions = {}) => {
      const { replace = false, timeout = 100 } = options

      // For authentication redirects, use window.location for more reliability
      if (replace) {
        window.location.replace(path)
        return
      }

      try {
        await router.push(path)
      } catch (error) {
        console.warn('Router navigation failed, using window.location', error)

        // Fallback to window.location with small delay
        setTimeout(() => {
          window.location.href = path
        }, timeout)
      }
    },
    [router]
  )

  return navigate
}