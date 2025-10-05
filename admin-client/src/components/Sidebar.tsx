import { Button } from "primereact/button";
import { routes } from "../config/routes";
import { Link } from "react-router-dom";
import { useSidebar } from "./SidebarrContext";
import { useAuth } from "./AuthContext";
import { useEffect, useState } from "react";
const menuItems = [
    {
        id: "dashboard",
        label: "Patterns",
        icon: "pi pi-chart-bar",
        path: routes.dashboard,
    },
    {
        id: "datasets",
        label: "Datasets",
        icon: "pi pi-folder",
        path: routes.datasets,
    },
    {
        id: "map-viewer",
        label: "Map Viewer",
        icon: "pi pi-map",
        path: routes.mapViewer,
    },
    {
        id: "graph",
        label: "Graph explorer",
        icon: "pi pi-share-alt",
        path: routes.graph,
    },
];
export const Sidebar = () => {
    const { setToken } = useAuth();
    const { open } = useSidebar();
    const [lateOpen, setLateOpen] = useState<boolean>(open)
    useEffect(()=>{
        if(open){
            setLateOpen(open)
            return;
        } 
        setTimeout(()=>{
            setLateOpen(open)
        },300)
    },[open])
    const handleLogout = () => {
        setToken(null);
    };

    return (
        <div
            className={`${
                open ? "w-[260px]" : "w-20"
            } bg-slate-800 shadow-lg transition-all duration-300 ease-in-out flex flex-col border-r border-slate-900 overflow-hidden`}
            style={{ height: "calc(100vh - 58px)" }}
        >
            {/* Header */}
            <div className="border-b border-slate-900">
                
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {lateOpen && (
                            <div className="transition-opacity duration-200 p-4">
                               
                                <p className="text-sm text-gray-500">
                                    Dashboard
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 p-4 space-y-2">
                <div className={`mb-4 ${!lateOpen ? "text-center" : ""}`}>
                    <h2
                        className={`text-sm font-semibold text-gray-200 uppercase tracking-wide ${
                            !lateOpen ? "hidden" : ""
                        }`}
                    >
                        Navigation
                    </h2>
                </div>

                <div className="flex flex-col gap-2">
                    {menuItems.map((item) => (
                        <Link to={item.path} key={item.id}>
                            <Button
                                key={item.id}
                                text
                                rounded
                                severity="secondary"
                                icon={item.icon}
                                label={lateOpen ? item.label : ""}
                                pt={{ label: { className: "text-left" } }}
                            />
                        </Link>
                    ))}
                </div>
            </nav>

            {/* User Profile Section */}
            <div className="border-t border-slate-900 p-4">
                <div
                    className={`flex items-center gap-3 ${
                        !lateOpen ? "justify-center" : ""
                    }`}
                >
                    <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-sky-600 rounded-full flex items-center justify-center text-white font-bold">
                        JD
                    </div>
                    {open && (
                        <div className="flex-1 transition-opacity duration-200">
                            <p className="font-medium text-gray-800">
                                John Doe
                            </p>
                            <p className="text-sm text-gray-500">
                                Administrator
                            </p>
                        </div>
                    )}
                </div>

                {open && (
                    <div className="mt-3 space-y-1 flex justify-between items-center">
                        <Button
                            icon={"pi pi-user"}
                            text
                            label="Profile"
                            severity="secondary"
                        ></Button>
                        <Button
                            className="text-sm p-2"
                            icon={"pi pi-sign-out"}
                            text
                            severity="secondary"
                            onClick={handleLogout}
                        ></Button>
                    </div>
                )}
            </div>
        </div>
    );
};
