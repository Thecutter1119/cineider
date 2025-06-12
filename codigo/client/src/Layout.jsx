import React from 'react'
import { NavLink, Outlet } from 'react-router'
import { useAuth } from './context/AuthContext'

function Layout() {

    const authContext = useAuth()

  return (
    <>
    <div id='navbar' className='py-5 md-5 md:px-10 items-center relative'>
        <div className="bg absolute inset-0 from-salmon bg-gradient-to-br to-rose-600 backdrop-blur-2xl opacity-70"></div>
        <div className="flex relative items-center">
            <div className='w-20'>
                <img src="/cineider.png" alt="logo" />
            </div>
          <div className='text-4xl font-logo'>Cineider Films</div>
          <div className='flex items-center ml-auto gap-5'>
            <NavLink to="/" className={({isActive}) => `text-corn hover:underline ${isActive ? "underline" : ""}`}>Cartelera</NavLink>
            {authContext.user && (<NavLink to="/dashboard" className={({isActive}) => `text-corn hover:underline ${isActive ? "underline" : ""}`}>Dashboard</NavLink>)}
            {/* <a href='#' className='w-10 h-10 bg-corn rounded-full ml-5'></a> */}
          </div>
          {
            authContext.user ? ('') :
            (
            <div className="flex gap-3 ml-5">
                <NavLink to={"/login"} className="rounded-xl bg-transparent transition text-corn hover:text-white hover:bg-rose-500 px-4 py-2">Iniciar Sesión</NavLink>
                <NavLink to={"/register"} className="rounded-xl bg-sky-500 hover:bg-sky-600 transition px-4 py-2">Registrarse</NavLink>
            </div>
            )
          }
        </div>
      </div>
      <Outlet/>
    </>
  )
}

export default Layout