import { describe, it, expect } from 'vitest'
import { cn, shouldFlagForQA } from '@/lib/utils'

describe('utils', () => {
    describe('cn', () => {
        it('should merge class names correctly', () => {
            expect(cn('c-1', 'c-2')).toBe('c-1 c-2')
        })

        it('should handle conditional classes', () => {
            expect(cn('c-1', true && 'c-2', false && 'c-3')).toBe('c-1 c-2')
        })

        it('should merge tailwind classes correctly', () => {
            expect(cn('p-4', 'p-2')).toBe('p-2')
            expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
        })
    })

    describe('shouldFlagForQA', () => {
        it('should return boolean', () => {
            const result = shouldFlagForQA(50)
            expect(typeof result).toBe('boolean')
        })

        it('should respect 0% probability', () => {
            // Mock Math.random to always return 0.5 (50%)
            // logic is random * 100 < percentage
            // if percentage is 0, 50 < 0 is false. 
            // even if random is 0, 0 < 0 is false.
            const result = shouldFlagForQA(0)
            expect(result).toBe(false)
        })

        it('should respect 100% probability', () => {
            const result = shouldFlagForQA(100)
            expect(result).toBe(true)
        })
    })
})
