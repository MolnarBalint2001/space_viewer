import React, { type PropsWithChildren } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { SidebarProvider } from "./SidebarrContext";
import { useAuth } from "./AuthContext";

export type LayoutProps = PropsWithChildren;

export const Layout = ({ children }: LayoutProps) => {
    const { user } = useAuth();
    return (
        <SidebarProvider>
            <Navbar />
            <div className="flex basis shrink-0">
                <div className="shrink-0">{user ? <Sidebar /> : null}</div>
                <div
                    className="w-full overflow-y-auto  "
                    style={{ height: "calc(100vh - 65px)" }}
                >
                    {children}
                </div>
            </div>
        </SidebarProvider>
    );
};
