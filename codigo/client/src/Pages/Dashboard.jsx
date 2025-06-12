import React from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import requestApi from '../helpers/requestApi'
import { useAuth } from '../context/AuthContext'

function Dashboard() {

    const {user} = useAuth()

    const navigator = useNavigate()

    const logOut = async () => {
        const {ok, data, error} = await requestApi('/logout', {method: 'POST'})
        if(ok) {
            sessionStorage.removeItem('session-data')
            navigator('/', {replace: true})
        }
    }

  return (
    <div className='p-10'>
        <div className='bg-black w-full flex flex-col md:flex-row rounded-xl overflow-hidden'>
            <div className='flex flex-col md:w-1/3 lg:w-1/5'>
                {/* <NavLink to={"./main"} className={({isActive}) => `${isActive ? "bg-darkbg text-corn" : ""} px-10 py-5 hover:bg-darkbg transition text-center text-white hover:text-corn`}>Inicio</NavLink> */}
                <NavLink to={"./profile"} className={({isActive}) => `${isActive ? "bg-darkbg text-corn" : ""} px-10 py-5 hover:bg-darkbg transition text-center text-white hover:text-corn`}>Perfil</NavLink>
                <NavLink to={"./purchases"} className={({isActive}) => `${isActive ? "bg-darkbg text-corn" : ""} px-10 py-5 hover:bg-darkbg transition text-center text-white hover:text-corn`}>Mis Compras</NavLink>
                {user.user_role === "admin" && (<NavLink to={"./admin"} className={({isActive}) => `${isActive ? "bg-darkbg text-corn" : ""} px-10 py-5 hover:bg-darkbg transition text-center text-white hover:text-corn`}>Admin</NavLink>)}
                <button onClick={logOut} className={`px-10 py-5 hover:bg-rose-700 transition text-center text-white hover:text-corn cursor-pointer`}>Cerrar Sesión</button>
            </div>
            <div className='grow p-5'>
                <Outlet/>
            </div>
        </div>
    </div>
  )
}

export default Dashboard