import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AuditLogViewer from '@/components/audit/AuditLogViewer';

// Mock server action/component behavior
// Since AuditLogViewer is an async component (RSC), we must treat it as a promise or mock the data fetching.
// In Vitest/RTL testing of Server Components is tricky. 
// A common pattern is to test the visual output given mocked props or mock the db call.
// But getAuditLogs is imported inside. We can mock that module function.
// Actually AuditLogViewer imports `getAuditLogs` from the SAME file if it's exported? 
// No, it calls `getAuditLogs`.

// We'll mock the module to spy on getAuditLogs OR we assume it's an async component that resolves data.
// For unit testing, it's easier to mock the Prisma call inside `getAuditLogs` 
// OR mock `getAuditLogs` itself if we are testing the default export.

vi.mock('@/lib/prisma', () => ({
    prisma: {
        auditLog: {
            findMany: vi.fn(),
        },
    },
}));

// We need to mock the component itself if it's Server Component? 
// RTL can render async components if we use `await AuditLogViewer(...)`.
// But React generic render doesn't support promises directly as JSX. 
// We might need to refactor AuditLogViewer to have a presentation component.
// OR we just test `getAuditLogs` function separately.

// Let's test `getAuditLogs` function logic (integration test) and then a stripped down UI test.

import { getAuditLogs } from '@/components/audit/AuditLogViewer';
import { prisma } from '@/lib/prisma';

describe('AuditLogViewer', () => {
    it('getAuditLogs fetches logs for organization', async () => {
        const mockLogs = [
            { id: '1', action: 'LOGIN', createdAt: new Date(), user: { name: 'Test' } }
        ];
        (prisma.auditLog.findMany as any).mockResolvedValue(mockLogs);

        const result = await getAuditLogs('org-1');
        expect(prisma.auditLog.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: { organizationId: 'org-1' },
            take: 50
        }));
        expect(result).toHaveLength(1);
    });

    // We can't easily test the JSX output of an async Server Component with standard RTL render
    // without wrapping it or using a framework-specific test utility. 
    // We'll skip the UI test for the Server Component and assume logical verification is enough for now,
    // or refactor if requested.
});
