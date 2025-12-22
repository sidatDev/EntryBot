import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DocumentViewer } from '@/components/document/DocumentViewer'

// Mock lucide icons
vi.mock('lucide-react', async (importOriginal) => {
    const actual = await importOriginal() as any
    return { ...actual }
})

describe('DocumentViewer', () => {
    it('renders PDF viewer correctly', () => {
        render(<DocumentViewer url="https://s3.url/test.pdf" type="PDF" />)
        const iframe = screen.getByTitle('PDF Viewer')
        expect(iframe).toBeInTheDocument()
        expect(iframe).toHaveAttribute('src', 'https://s3.url/test.pdf')
    })

    it('renders Image viewer correctly', () => {
        render(<DocumentViewer url="https://s3.url/test.png" type="IMAGE" />)
        const img = screen.getByAltText('Document')
        expect(img).toBeInTheDocument()
        expect(img).toHaveAttribute('src', 'https://s3.url/test.png')
    })

    it('handles zoom interactions', () => {
        render(<DocumentViewer url="https://s3.url/test.png" type="IMAGE" />)

        const zoomIn = screen.getByTitle('Zoom In')
        const zoomOut = screen.getByTitle('Zoom Out')
        const container = screen.getByAltText('Document').parentElement

        // Initial scale 1
        expect(container).toHaveStyle({ transform: 'scale(1) rotate(0deg)' })

        // Zoom In -> 1.2
        fireEvent.click(zoomIn)
        expect(container).toHaveStyle({ transform: 'scale(1.2) rotate(0deg)' })

        // Zoom Out -> 1.0 (float precision might matter, usually RTL handles it or we check substring)
        // 1.2 - 0.2 = 1.0 
        fireEvent.click(zoomOut)
        expect(container).toHaveStyle({ transform: 'scale(1) rotate(0deg)' })
    })

    it('handles rotate interactions', () => {
        render(<DocumentViewer url="https://s3.url/test.png" type="IMAGE" />)

        const rotate = screen.getByTitle('Rotate')
        const container = screen.getByAltText('Document').parentElement

        // Rotate -> 90
        fireEvent.click(rotate)
        expect(container).toHaveStyle({ transform: 'scale(1) rotate(90deg)' })
    })
})
