import React, { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router'
import requestApi from '../../helpers/requestApi';
import { useAuth } from '../../context/AuthContext';

function Login() {
    const {checkAuth} = useAuth()
    const navigate = useNavigate()

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault()
        const form = e.target
        const {email, password} = form

        const body = {
            email: email.value,
            password: password.value,
        }

        setLoading(true)
        const {ok, data, status, error} = await requestApi('/login', {method: 'POST', body})
        // console.log(ok, data, status, error)
        if (ok) {
            sessionStorage.setItem("session-data", JSON.stringify(data.user))
            await checkAuth()
            navigate('/dashboard', {replace: true})
        } else {
            if (status === 500) {
                setMessage("Error del servidor. Intente más tarde o contactese con el administrador.")
            } else if(error.error) {
                setMessage('Error: ' + error.error)
            } else {
                setMessage("Error inesperado. Intente nuevamente o contactese con el administrador.")
            }
        }
        setLoading(false)

    }

  return (
    <div className='flex flex-col px-5 py-5 h-full'>
        <div className='bg-black rounded px-5 py-10 m-auto w-full md:w-2/3 xl:w-1/3'>
            <h3 className='text-3xl font-title'>Iniciar Sesión</h3>
            <div className='mt-5'>
                <form onSubmit={handleSubmit}>
                    <div className='flex flex-col gap-3 mb-10'>
                        <p>Email:</p>
                        <input required type="email" name="email" placeholder='Ingrese su email' className='w-full outline-none px-3 py-2 rounded-xl border-salmon border focus:bg-purple-950 transition'/>
                        <p>Contraseña:</p>
                        <input required type="password" name="password" placeholder='Ingrese su contraseña' className='w-full outline-none px-3 py-2 rounded-xl border-salmon border focus:bg-purple-950 transition'/>
                        <Link to="/forgot" className='text-sm text-corn underline' >¿Olvidaste tu contraseña?</Link>
                    </div>
                    {
                        message && (
                            <p className='text-rose-600 text-center my-3'>{message}</p>
                        )
                    }
                    <button disabled={loading} className='disabled:opacity-70 bg-salmon px-5 py-2 rounded-xl w-full hover:bg-corn transition text-corn hover:text-salmon cursor-pointer'>Ingresar</button>
                </form>
            </div>
            <p className='mt-3 text-center text-sm opacity-80'>¿No tienes cuenta? <Link to={"/register"} className="underline text-corn">Registrate</Link></p>
        </div>
        <div className='logo mx-auto flex'>
            <div className='w-20'>
                <img src="/cineider.png" alt="logo" />
            </div>
            <h3 className='text-4xl font-logo text-center my-5'>Cineider Films</h3>
        </div>
    </div>
  )
}

export default Login