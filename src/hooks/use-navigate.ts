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

      try {
        if (replace) {
          await router.replace(path)
        } else {
          await router.push(path)
        }
      } catch (error) {
        console.warn('Router navigation failed, using window.location', error)

        // Fallback to window.location with small delay
        setTimeout(() => {
          if (replace) {
            window.location.replace(path)
          } else {
            window.location.href = path
          }
        }, timeout)
      }
    },
    [router]
  )

  return navigate
}
