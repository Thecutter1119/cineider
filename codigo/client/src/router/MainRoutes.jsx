import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import Layout from "../Layout";
import Cartelera from "../Pages/Cartelera";
import Login from "../Pages/Auth/Login";
import Register from "../Pages/Auth/Register";
import Movie from "../Pages/Movie";
import Dashboard from "../Pages/Dashboard";
import { Main, Profile, Purchases } from "../Pages/dashboard/UserDashboard";
import AdminDashboard from "../Pages/dashboard/AdminDashboard";
import Forgot from "../Pages/Auth/Forgot";
import { useAuth } from "../context/AuthContext";

function MainRoutes() {

  const authContext = useAuth()

  return (
    <>
      <Routes>
        <Route path="*">
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot" element={<Forgot />} />
          <Route path="*" element={<Layout />}>
            <Route index element={<Cartelera />} />
            <Route path="dashboard" element={authContext.loading || !authContext.user ? <div></div> :<Dashboard />}>
              <Route index element={<Navigate to={'profile'} replace />} />
              {/* <Route path="main" element={<Main />} /> */}
              <Route path="profile" element={<Profile />} />
              <Route path="purchases" element={<Purchases />} />
              <Route path="admin" element={<AdminDashboard />} />
            </Route>

            <Route path="movie/:movie_id" element={<Movie />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}

export default MainRoutes;
