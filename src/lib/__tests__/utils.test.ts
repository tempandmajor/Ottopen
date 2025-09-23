import { cn } from '../utils'

describe('Utils', () => {
  describe('cn function', () => {
    it('should merge class names correctly', () => {
      const result = cn('base-class', 'additional-class')
      expect(result).toContain('base-class')
      expect(result).toContain('additional-class')
    })

    it('should handle conditional classes', () => {
      const result = cn('base-class', true && 'conditional-class', false && 'hidden-class')
      expect(result).toContain('base-class')
      expect(result).toContain('conditional-class')
      expect(result).not.toContain('hidden-class')
    })

    it('should merge tailwind classes correctly', () => {
      const result = cn('p-4', 'p-2')
      // Should resolve conflicts and keep the last p-2
      expect(result).toBe('p-2')
    })

    it('should handle empty inputs', () => {
      const result = cn()
      expect(result).toBe('')
    })

    it('should handle null and undefined inputs', () => {
      const result = cn('base-class', null, undefined, 'other-class')
      expect(result).toContain('base-class')
      expect(result).toContain('other-class')
    })
  })
})