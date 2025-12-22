import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TopHeader } from '@/components/dashboard/TopHeader'

// Mock icons
vi.mock('lucide-react', async (importOriginal) => {
    const actual = await importOriginal() as any
    return { ...actual }
})

// Mock NotificationBell
vi.mock('@/components/layout/NotificationBell', () => ({
    default: () => <div data-testid="notification-bell" />
}))

describe('TopHeader', () => {
    it('renders search input and profile', () => {
        render(<TopHeader />)
        expect(screen.getByPlaceholderText('Search documents...')).toBeInTheDocument()
        expect(screen.getByText('JD')).toBeInTheDocument()
        expect(screen.getByTestId('notification-bell')).toBeInTheDocument()
    })

    it('calls toggleSidebar when menu button is clicked', () => {
        const toggleSidebar = vi.fn()
        render(<TopHeader toggleSidebar={toggleSidebar} />)

        // Menu button is only visible on mobile (md:hidden), but usually rendered in DOM
        // We can find it by looking for the button containing Menu icon
        // Or simply getByRole('button') 
        const buttons = screen.getAllByRole('button')
        // The one with Menu icon. Since we mocked lucide, lets assume simple button click.
        // Or just fire event on the button that has toggleSidebar prop? 
        // Logic: <button onClick={toggleSidebar}> <Menu /> </button>

        // Let's assume it's the first button or look for semantic match
        fireEvent.click(buttons[0])
        expect(toggleSidebar).toHaveBeenCalled()
    })
})
