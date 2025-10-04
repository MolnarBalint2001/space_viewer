/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from "react";

// A JWT alapján értelmezett user típus
type AuthUser = {
    email: string;
    id: string;
} | null;

type AuthContextType = {
    user: AuthUser;
    setToken: (token: string | null) => void;
    token: string | null;
};

const defaultContext: AuthContextType = {
    user: null,
    setToken: () => {},
    token: null,
};

export const AuthContext = createContext<AuthContextType>(defaultContext);

export const useAuth = () => useContext(AuthContext);

// 🧠 Helper: Lokál tárból kiolvassa a JWT-t és visszaadja a user-t
function getUserFromLocalStorage(): AuthUser {
    try {
        const token = localStorage.getItem("token");
        if (!token) return null;
        const base64Payload = token.split(".")[1];
        const payload = JSON.parse(atob(base64Payload));
        return {
            email: payload.email,
            id: payload.id,
        };
    } catch (err) {
        console.warn("Invalid JWT token in localStorage:", err);
        return null;
    }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<AuthUser>(() => getUserFromLocalStorage());
    const [token, setJwtToken] = useState<string | null>(()=>localStorage.getItem("token"));
    const setToken = (token: string | null) => {
        if (token) {
            localStorage.setItem("token", token);
            const parsedUser = getUserFromLocalStorage();
            setUser(parsedUser);
            setJwtToken(token);
        } else {
            localStorage.removeItem("token");
            setUser(null);
            setJwtToken(null);
        }
    };
   

    return (
        <AuthContext.Provider value={{ user, setToken, token }}>
            {children}
        </AuthContext.Provider>
    );
};
