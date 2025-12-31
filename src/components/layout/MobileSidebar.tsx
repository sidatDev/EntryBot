"use client";

import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Sidebar } from "@/components/layout/Sidebar"; // We'll reuse the content if possible or just duplicate the nav logic
import { Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export function MobileSidebar() {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    // Close on route change
    useEffect(() => {
        setOpen(false);
    }, [pathname]);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <button className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-md">
                    <Menu className="h-6 w-6" />
                </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 bg-[#1e293b] text-white w-72 border-none">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="h-full overflow-y-auto">
                    <Sidebar mobile />
                </div>
            </SheetContent>
        </Sheet>
    );
}
