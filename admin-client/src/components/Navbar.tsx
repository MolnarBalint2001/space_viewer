import { Button } from "primereact/button";
import { useSidebar } from "./SidebarrContext";
import AdminLogo from "../assets/icons8-nasa-480.png";
import { useAuth } from "./AuthContext";
export const Navbar = () => {
    const { toggle } = useSidebar();
    const { user } = useAuth();

    return (
        <nav className="h-16 bg-slate-900 w-full flex px-4 justify-between items-center text-white">
            <div className="flex items-center gap-2">
                {user ? (
                    <Button
                        icon={"pi pi-bars"}
                        text
                        className="text-white"
                        rounded
                        onClick={() => toggle()}
                    />
                ) : null}

                <img src={AdminLogo} alt="" className="h-16" />
                <span className="text-2xl font-bold ">
                    AstraLink
                </span>
            </div>
            <div></div>
            <div></div>
        </nav>
    );
};
