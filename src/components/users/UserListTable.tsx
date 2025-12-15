"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Ban, CheckCircle, Mail } from "lucide-react";
import { toggleUserStatus } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { EditUserModal } from "@/components/users/EditUserModal";

// Define interface manually since Prisma client might be out of sync
interface User {
    id: string;
    name: string | null;
    email: string;
    role: string;
    status: string;
    customRole?: { name: string } | null;
}

interface UserListTableProps {
    users: any[]; // Using any[] temporarily to avoid build breaks before migration
    customRoles: any[]; // Pass roles for the edit modal
}

export function UserListTable({ users, customRoles }: UserListTableProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [editingUser, setEditingUser] = useState<any | null>(null);

    const handleStatusToggle = async (userId: string, currentStatus: string) => {
        setIsLoading(true);
        const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
        try {
            await toggleUserStatus(userId, newStatus);
            router.refresh();
        } catch (error) {
            console.error("Failed to update status", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[70px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell className="font-medium">
                                {user.name || "N/A"}
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className="bg-slate-50">
                                    {user.customRole?.name || user.role}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <Badge variant={user.status === "ACTIVE" ? "success" : "secondary"} // Assuming we might add success variant later, or just map colors
                                    className={user.status === "ACTIVE" ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-slate-100 text-slate-800 hover:bg-slate-100"}>
                                    {user.status}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => setEditingUser(user)}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Edit Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleStatusToggle(user.id, user.status)} disabled={isLoading}>
                                            {user.status === "ACTIVE" ? (
                                                <>
                                                    <Ban className="mr-2 h-4 w-4 text-red-500" />
                                                    Deactivate User
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                                    Activate User
                                                </>
                                            )}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <Mail className="mr-2 h-4 w-4" />
                                            Resend Welcome
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {editingUser && (
                <EditUserModal
                    user={editingUser}
                    customRoles={customRoles}
                    open={!!editingUser}
                    onOpenChange={(open: boolean) => !open && setEditingUser(null)}
                />
            )}
        </div>
    );
}
