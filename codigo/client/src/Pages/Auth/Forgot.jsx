import React, { useState } from 'react'
import requestApi from '../../helpers/requestApi'
import { Link } from 'react-router'

function Forgot() {

    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState(null)

    const handleSubmit = async (e) => {
        e.preventDefault()
        const email = e.target.email.value
        setLoading(true)
        const res = await requestApi('/forgot-password', {method: 'POST', body: {email}})
        console.log(res)
        setMessage(null)
        if(res.ok){
            setMessage("Se envió el correo electrónico de recuperación")
            setTimeout(() => setLoading(false), 30000)
        } else {
            if(res.error?.error) {
                setMessage('Error: ' + res.error.error)
            } else {
                setMessage('Error inesperado. Intente nuevamente o contactese con el administrador.')
            }
            setLoading(false)
        }
    }

  return (
    <div className='flex flex-col px-5 py-5 h-full'>
        <div className='bg-black rounded px-5 py-10 m-auto w-full md:w-2/3 xl:w-1/3'>
            <Link to={'/login'} className='text-sm hover:underline'>{"< Volver"}</Link>
            <h3 className='text-3xl font-title mt-5'>Recuperar Contraseña</h3>
            <div className='mt-5'>
                <form onSubmit={handleSubmit}>
                    <div className='flex flex-col gap-3 mb-10'>
                        <p>Email:</p>
                        <input required type="email" name="email" placeholder='Ingrese su email' className='w-full outline-none px-3 py-2 rounded-xl border-salmon border focus:bg-purple-950 transition'/>
                    </div>
                    {
                        message && (
                            <p className='text-rose-600 text-center my-3'>{message}</p>
                        )
                    }
                    <button disabled={loading} className='disabled:opacity-70 bg-salmon px-5 py-2 rounded-xl w-full hover:bg-corn transition text-corn hover:text-salmon cursor-pointer'>Envíar correo de recuperación</button>
                </form>
            </div>
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

export default Forgot