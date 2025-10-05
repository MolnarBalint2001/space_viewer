import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import { AuthProvider } from "./components/AuthContext";
import { Layout } from "./components/Layout";
import { routes } from "./config/routes";
import { LoginPage } from "./features/login/LoginPage";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { MapViewerPage } from "./features/mapViewer/MapViewerPage";
import { DatasetManagerPage } from "./features/datasets/DatasetManagerPage";
import { GraphExplorerPage } from "./features/graph/GraphExplorerPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RealtimeProvider } from "./components/RealtimeProvider";

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
                        <RealtimeProvider>
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
                                <Route
                                    path={routes.datasets}
                                    element={<DatasetManagerPage />}
                                />
                                <Route
                                    path={routes.graph}
                                    element={<GraphExplorerPage />}
                                />
                                </Route>

                                <Route
                                    path={routes.login}
                                    element={<LoginPage />}
                                />
                            </Routes>
                        </Layout>
                        </RealtimeProvider>
                    </ToastProvider>
                </AuthProvider>
            </QueryClientProvider>
        </BrowserRouter>
    );
}

export default App;
