import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import requestApi from "../helpers/requestApi";
import { useAuth } from "../context/AuthContext";

function Movie() {
  const { movie_id } = useParams();
  const navigate = useNavigate()

  const {user} = useAuth()

  const [movie, setMovie] = useState(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const [functions, setFunctions] = useState([])

  const [startBuy, setStartBuy] = useState(false);
  const [openFuntion, setOpenFunction] = useState(null);
  const [seats, setSeats] = useState([]);
  const [reserved, setReserved] = useState([])

  const [message, setMessage] = useState(false)

  useEffect(() => {
    const getMovies = async () => {
      setError(false);
      setLoading(true);
      const res = await requestApi("/movies");
      if (res.ok) {
        const found = res.data.movies.find((val) => String(val.id) === movie_id);
        if (!found) {
          setError("Movie not found");
        } else {
          setMovie(found);
        }
      } else {
        setError("Error al cargar");
      }
      setLoading(false);
    };

    const getFunctions = async () => {
    const res = await requestApi("/functions?movie_id=" + movie_id );
    console.log(res)
    if (res.ok) {
      setFunctions(res.data.functions);
    }  else {
        setError("Error al cargar");
    }
  }
  getMovies();
  getFunctions();
  }, [movie_id]);

  const closeOpenFunction = () => {
    setOpenFunction(false);
    setSeats([]);
    setReserved([])
  };

  const OpenAFuntion = async (val) => {
    const res = await requestApi('/check-seats', {method: 'POST', body: {function_id: val.id}})
    if(res.ok) {
        setReserved(res.data.reserved_seats)
    }
    setOpenFunction(val)
  }

  const selectSeat = (seat) => {
    if (!seats.find((val) => val === seat)) {
      setSeats((prev) => [...prev, seat]);
    } else {
      setSeats(seats.filter((val) => val !== seat));
    }
    // console.log(seats)
  };

  const submitSeats = async () => {
    // const seatsl = seats.length;
    setMessage(false)
    const res = await requestApi('/reserve-seats', {method: 'POST', body: {
        function_id: openFuntion.id,
        seats
    }})

    if(!res.ok) {
        return setMessage("Error al reservar sillas: " + res.error.error)
    }

    const res2 = await requestApi('/purchase-ticket', {method: 'POST', body: {
        function_id: openFuntion.id,
        seats
    }})

    if (res2.ok) {
        navigate('/dashboard/purchases')
    } else {
        if(res2.error?.error){
            setMessage(res2.error.error)
        } else {
            setMessage("Error al comprar tickete, por favor intente de nuevo.")
        }
    }
    
  };

  if (loading) {
    return <div></div>;
  }

  if (error) {
    return <div className="text-3xl my-10 text-center">{error}</div>;
  }

  return (
    <div className="px-10 py-10 md:mt-30">
      <div className="w-full md:w-4/5 xl:w-2/3 mx-auto bg-black px-5 py-10 rounded-xl">
        <div className="flex gap-5 flex-col-reverse md:flex-row md:min-h-[156px] lg:min-h-[256px]">
          <div className="mr-auto">
            <h3 className="text-3xl font-title mb-10">{movie.title}</h3>
            {
                movie.genre && (
                    <p className="mb-1">
                    Genero: <span>{movie.genre}</span>
                    </p>
                )
            }
            <p className="mb-1">
              Duración: <span>{movie.duration} minutos</span>
            </p>
            <p className="mb-1">
              Clasificación: <span>{movie.rating}</span>
            </p>
            <p className="text-lg mt-5">Sinopsis:</p>
            <p>
              {movie.synopsis}
            </p>
          </div>
          <div className="relative mx-auto md:mx-0 md:w-[200px] lg:w-[300px] md:mr-10">
            <div className="w-[200px] h-[300px] lg:w-[300px] lg:h-[400px] bg-gray-500 md:relative left-0 -top-36"></div>
          </div>
        </div>

        {
        !user ? (
            <Link
              to={'/login'}
              className="px-5 py-3 bg-salmon text-corn rounded-xl hover:bg-corn hover:text-salmon transition"
            >
              Inicia sesión para comprar un tickete
            </Link>
        ) :
        startBuy ? (
          <div className="mt-5 flex flex-col">
            <h3 className="text-3xl mb-5">Funciones</h3>
            <div className="flex flex-col gap-1 bg-dark p-3 mx-auto w-full md:w-2/3">
                {
                    functions.map(val => (
                        <div
                            key={val.id}
                            onClick={() => OpenAFuntion(val)}
                            className="px-5 py-3 flex items-center bg-black hover:bg-purple-950 transition cursor-pointer"
                        >
                            <div className="">
                            <h3 className="opacity-80">Fecha y hora:</h3>
                            <p className="text-xl">{val.datetime}</p>
                            <p>
                                Sala: <span>{val.room.name}</span>
                            </p>
                            <p>
                                Asientos disponibles: <span>{val.available_seats}</span>
                            </p>
                            </div>
                            <div className="ml-auto">
                            <p className="opacity-80">Precio:</p>
                            <p className="text-lg">${val.price}</p>
                            </div>
                        </div>

                    ))
                }
            </div>
          </div>
        ) : (
          <div className="mt-5">
            <button
              onClick={() => setStartBuy(true)}
              className="px-5 py-3 bg-salmon text-corn rounded-xl hover:bg-corn hover:text-salmon transition"
            >
              Comprar Ticket
            </button>
          </div>
        )}
        {openFuntion && (
          <div className="absolute inset-0">
            <div
              onClick={() => closeOpenFunction()}
              className="absolute inset-0 bg-black opacity-70"
            ></div>
            <div className="w-full h-full overflow-auto flex flex-col">
              <div className="relative m-auto bg-dark rounded-xl p-5 w-full min-w-max md:w-3/4 lg:w-2/4 flex flex-col">
                <h3 className="text-center text-3xl mb-5">
                  Seleccionar Sillas
                </h3>
                <div className="flex gap-5 justify-center">
                  <div className="p-2 bg-slate-400 w-[400px] min-h-[400px]">
                    <div className="mt-2 w-full h-3 bg-slate-500 mb-5"></div>
                    <div className="grid grid-cols-5">
                      {Array.from(Array(openFuntion.room.capacity)).map((val, i) => {
                        const isSelected = seats.includes(i + 1);
                        const notAviable = reserved.includes(String(i+1));

                        return (
                          <div
                            key={i + 1}
                            className="seat p-3 flex justify-center items-center"
                          >
                            <div
                              onClick={() =>
                                !notAviable ? selectSeat(i + 1) : null
                              }
                              className={`${
                                notAviable
                                  ? "bg-slate-500"
                                  : `cursor-pointer ${
                                      isSelected
                                        ? "bg-orange-600"
                                        : "bg-slate-700"
                                    } hover:bg-salmon`
                              } w-[40px] h-[50px] flex select-none transition`}
                            >
                              <p className="text-center m-auto">{i + 1}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="w-1/2">
                    <p className="text-3xl">
                      Total: $<span>{openFuntion.price * seats.length}</span>
                    </p>
                  </div>
                </div>
                {
                    message && (
                        <p className="text-rose-700 text-center my-5">{message}</p>
                    )
                }
                <div className="mt-5 flex gap-3 mx-auto">
                  <button
                    disabled={seats.length === 0}
                    onClick={submitSeats}
                    className={`${
                      seats.length > 0 ? "hover:bg-sky-600" : "opacity-80"
                    } bg-sky-700 transition py-3 px-5 rounded-xl`}
                  >
                    Aceptar
                  </button>
                  <button
                    onClick={closeOpenFunction}
                    className="bg-rose-600 hover:bg-rose-500 transition py-3 px-5 rounded-xl"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Movie;
