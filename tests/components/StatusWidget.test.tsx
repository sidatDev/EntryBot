import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusWidget } from '@/components/dashboard/StatusWidget'

// Mock Recharts to avoid heavy SVG rendering issues in simple test
vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    PieChart: ({ children }: any) => <div>{children}</div>,
    Pie: () => <div data-testid="pie-chart" />,
    Cell: () => <div />,
}))

// Mock internal components
vi.mock('@/components/upload/UploadModal', () => ({
    UploadModal: () => <button>Upload Logic</button>
}))

// Mock next/link
vi.mock('next/link', () => ({
    default: ({ children, href }: any) => <a href={href}>{children}</a>
}))

describe('StatusWidget', () => {
    it('renders title and counts correctly', () => {
        render(
            <StatusWidget
                title="Sales Invoices"
                description="Overview"
                processedCount={10}
                totalCount={100}
                uploadCategory="SALES"
                viewLink="/test"
                colors={['#000', '#fff']}
            />
        )

        expect(screen.getByText('Sales Invoices')).toBeInTheDocument()
        expect(screen.getByText('10')).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /View Data/i })).toHaveAttribute('href', '/test')
    })
})
