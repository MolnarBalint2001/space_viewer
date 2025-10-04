import { useAuth } from "./AuthContext";
import { Navigate, Outlet } from "react-router-dom";
import { routes } from "../config/routes";

export const ProtectedRoute = () => {
    const { user } = useAuth();
    if (!user) {
        return <Navigate to={routes.login} />;
    }
    return <Outlet />;
};
