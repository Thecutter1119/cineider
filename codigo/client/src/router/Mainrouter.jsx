import React from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'
import Layout from '../Layout'
import Cartelera from '../Pages/Cartelera'
import Login from '../Pages/Auth/Login'
import Register from '../Pages/Auth/Register'
import Movie from '../Pages/Movie'
import Dashboard from '../Pages/Dashboard'
import { Main, Profile, Purchases } from '../Pages/dashboard/UserDashboard'
import AdminDashboard from '../Pages/dashboard/AdminDashboard'
import Forgot from '../Pages/Auth/Forgot'
import { AuthProvider } from '../context/AuthContext'
import MainRoutes from './MainRoutes'

function Mainrouter() {
  return (
    <BrowserRouter>
        <AuthProvider>
            <MainRoutes/>
        </AuthProvider>
    </BrowserRouter>
  )
}

export default Mainrouter