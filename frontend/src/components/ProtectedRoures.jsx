import { useContext } from "react";
import { useLocation } from "react-router";
import { Navigate, Outlet } from "react-router-dom";
import Cookies from 'js-cookie';

const useAuth = () => {
    return Cookies.get("email");
};

export const ProtectedRoutes = () => {
    const location = useLocation();
    const isAuth = true;
    return isAuth ? (
        <Outlet />
    ) : (
        <Navigate to="/admin" replace state={{ from: location }} />
    );
};