import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createUser, updateUser } from '@/lib/actions'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
    }
}))

// Mock bcrypt
vi.mock('bcryptjs', () => ({
    hash: vi.fn(),
}))

// Mock next/cache
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

describe('User Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('createUser', () => {
        it('throws if email already exists', async () => {
            (prisma.user.findUnique as any).mockResolvedValue({ id: 'existing' })
            await expect(createUser({
                name: 'Test',
                email: 'test@example.com',
                password: 'password',
                role: 'CLIENT'
            })).rejects.toThrow('Email already exists')
        })

        it('creates user with hashed password and correct role', async () => {
            (prisma.user.findUnique as any).mockResolvedValue(null)
                ; (hash as any).mockResolvedValue('hashed_password')
                ; (prisma.user.create as any).mockResolvedValue({ id: 'new-user', email: 'new@example.com' })

            await createUser({
                name: 'New User',
                email: 'new@example.com',
                password: 'password123',
                role: 'ADMIN'
            })

            expect(hash).toHaveBeenCalledWith('password123', 12)
            expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    role: 'ADMIN',
                    password: 'hashed_password'
                })
            }))
        })
    })

    describe('updateUser', () => {
        it('hashes password if provided in update', async () => {
            (hash as any).mockResolvedValue('new_hashed')
                ; (prisma.user.update as any).mockResolvedValue({})

            await updateUser('user-1', { password: 'newpassword' })

            expect(hash).toHaveBeenCalledWith('newpassword', 12)
            expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'user-1' },
                data: expect.objectContaining({
                    password: 'new_hashed'
                })
            }))
        })

        it('clears customRoleId if role changed to ADMIN', async () => {
            await updateUser('user-1', { role: 'ADMIN' })

            expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    role: 'ADMIN',
                    customRoleId: null
                })
            }))
        })
    })
})
