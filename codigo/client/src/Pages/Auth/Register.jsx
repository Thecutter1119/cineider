import React, { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router'
import requestApi from '../../helpers/requestApi';
import { useAuth } from '../../context/AuthContext';

function Register() {
    const {checkAuth} = useAuth()

    const navigate = useNavigate()

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault()
        const form = e.target
        const {name, age, email, password, confirm} = form

        if (confirm.value !== password.value) {
            return setMessage("Las contraseñas no coinciden.")
        } else {
            setMessage(null)
        }

        const body = {
            name: name.value,
            age: parseInt(age.value),
            password: password.value,
            email: email.value
        }

        setLoading(true)
        const {ok, data, status, error} = await requestApi('/register', {method: 'POST', body})
        // console.log(ok, data, status, error)
        if (ok) {
            const res = await requestApi('/login', {
                method: 'POST',
                body: {
                    email: body.email,
                    password: body.password
                }
            })

            if (res.ok) {
                sessionStorage.setItem("session-data", JSON.stringify(res.data.user))
                await checkAuth()
                navigate('/dashboard', {replace: true})
            } else {
                if (res.error?.error){
                    setMessage("Error: " + res.error.error)
                } else {
                    setMessage("Error inseperado. Intente iniciar seción nuevamente o contactese con el administrador")
                }
            }
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
        <h3 className='text-3xl font-title'>Registro</h3>
            <div className='mt-5'>
                <form onSubmit={handleSubmit}>
                    <div className='flex flex-col gap-3 mb-10'>
                        <p>Nombre:</p>
                        <input required type="text" name="name" placeholder='Ingrese su nombre' className='w-full outline-none px-3 py-2 rounded-xl border-salmon border focus:bg-purple-950 transition'/>
                        <p>Edad:</p>
                        <input required type="number" min={1} max={100} name="age" placeholder='Ingrese su edad' className='w-full outline-none px-3 py-2 rounded-xl border-salmon border focus:bg-purple-950 transition'/>
                        <p>Email:</p>
                        <input required type="email" name="email" placeholder='Ingrese su email' className='w-full outline-none px-3 py-2 rounded-xl border-salmon border focus:bg-purple-950 transition'/>
                        <div className='flex gap-1 flex-wrap md:flex-nowrap'>
                            <div className='w-full'>
                                <p>Contraseña:</p>
                                <input required type="password" name="password" placeholder='Ingrese su contraseña' className='w-full outline-none px-3 py-2 rounded-xl border-salmon border focus:bg-purple-950 transition'/>
                            </div>
                            <div className='w-full'>
                                <p>Cofirmar Contraseña:</p>
                                <input required type="password" name="confirm" placeholder='Ingrese la contraseña nuevamente' className='w-full outline-none px-3 py-2 rounded-xl border-salmon border focus:bg-purple-950 transition'/>
                            </div>
                        </div>
                    </div>
                    {
                        message && (
                            <p className='text-rose-600 text-center my-3'>{message}</p>
                        )
                    }
                    <button disabled={loading} className='disabled:opacity-70 bg-salmon px-5 py-2 rounded-xl w-full hover:bg-corn transition text-corn hover:text-salmon cursor-pointer'>Registrarse</button>
                </form>
            </div>
            <p className='mt-3 text-center text-sm opacity-80'>¿Ya tienes cuenta? <Link to={"/login"} className="underline text-corn">Inicia sesión</Link></p>
            
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

export default Register