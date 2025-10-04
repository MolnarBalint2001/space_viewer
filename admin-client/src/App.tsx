import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import { AuthProvider } from "./components/AuthContext";
import { Layout } from "./components/Layout";
import { routes } from "./config/routes";
import { LoginPage } from "./features/login/LoginPage";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { MapViewerPage } from "./features/mapViewer/MapViewerPage";
import { ProtectedRoute } from "./components/ProtectedRoute";

import "primereact/resources/themes/lara-dark-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { ToastProvider } from "./components/ToastContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
const queryClient = new QueryClient();
function App() {
    return (
        <BrowserRouter>
            <QueryClientProvider client={queryClient}>
                <AuthProvider>
                    <ToastProvider>
                        <Layout>
                            <Routes>
                                {/* Védett útvonalak */}
                                <Route element={<ProtectedRoute />}>
                                <Route
                                    path="/" 
                                    element={<DashboardPage />}
                                />
                                <Route
                                    path="/dashboard"
                                    element={<DashboardPage />}
                                />
                                <Route
                                    path={routes.mapViewer}
                                    element={<MapViewerPage />}
                                />
                                   
                                </Route>

                                <Route
                                    path={routes.login}
                                    element={<LoginPage />}
                                />
                            </Routes>
                        </Layout>
                    </ToastProvider>
                </AuthProvider>
            </QueryClientProvider>
        </BrowserRouter>
    );
}

export default App;
