import React, { useEffect, useState, useTransition } from "react";
import requestApi from "../../helpers/requestApi";

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [statsErr, setStatsErr] = useState(false);

  const [createReport, setCreateReport] = useState(false);
  const [loadingRe, setLoadingRe] = useState(false);
  const [reportErr, setReportError] = useState(false);

  const [logs, setLogs] = useState(null);
  const [logsErr, setLogsErr] = useState(false);

  const [createMovie, setCreateMov] = useState(false);
  const [loadingM, setLoadingM] = useState(false);
  const [movErr, setMovErr] = useState(false);
  const [createMovErr, setCreateMovErr] = useState(false);
  const [movies, setMovies] = useState([]);
  const [editMov, setEditMov] = useState(null);

  const [createRoom, setCreateRoom] = useState(false)
  const [loadingRoom, setLoadingRoom] = useState(false)
  const [roomErr, setRoomErr] = useState(false)
  const [createRoomErr, setCreateRoomErr] = useState(false)
  const [rooms, setRooms] = useState([])

  const [createFunction, setCreateFun] = useState(false)
  const [loadingFun, setLoadingFun] = useState(false)
  const [createFunErr, setCreateFunErr] = useState(false)
  const [functions, setFunctions] = useState([])
  const [functionErrf, setFunctionErr] = useState(false)

  const getStatistics = async () => {
    setStatsErr(false);
    const res = await requestApi("/admin/dashboard");
    if (res.ok) {
      setStats(res.data);
    } else {
      setStatsErr("Error al obtener las estadísticas");
    }
  };

  const getLogs = async () => {
    const res = await requestApi("/admin/activity-logs");
    setLogsErr(false);
    if (res.ok) {
      setLogs(res.data.logs);
    } else {
      setLogsErr("Error al obtener los registros");
    }
  };

  const getMovies = async () => {
    setMovErr(false)
    const res = await requestApi("/movies");
    if (res.ok) {
      setMovies(res.data.movies);
    } else {
      setMovErr("Error al obtener las peliculas");
    }
  };

  const getRooms = async () => {
    setRoomErr(false)
    const res = await requestApi("/rooms");
    if (res.ok) {
      setRooms(res.data.rooms);
    } else {
      setRoomErr("Error al obtener las salas");
    }
  }

  const getFunctions = async () => {
    setFunctionErr(false)
    const res = await requestApi("/functions");
    if (res.ok) {
      setFunctions(res.data.functions);
    } else {
      setFunctionErr("Error al obtener las funciones");
    }
  }
  

  useEffect(() => {
    getStatistics();
    getLogs();
    getMovies();
    getRooms();
    getFunctions();
  }, []);

  const handleReport = async (e) => {
    e.preventDefault();
    const { type, start_date, end_date } = e.target;

    const body = {
      type: type.value,
      start_date: start_date.value,
      end_date: end_date.value,
    };
    setLoadingRe(true);
    setReportError(false);
    const res = await requestApi("/admin/reports", { method: "POST", body });
    if (res.ok) {
      console.log(res.data);
      setCreateReport(false);
    } else {
      setReportError("Error al generar reporte. Intente nuevamente.");
    }
    setLoadingRe(false);
  };

  const handleCreateMov = async (e) => {
    e.preventDefault();
    const { title, synopsis, duration, rating, genre } = e.target;
    const body = {
      title: title.value,
      synopsis: synopsis.value,
      duration: parseInt(duration.value),
      rating: rating.value,
      genre: genre.value,
    };
    setLoadingM(true);
    setCreateMovErr(false);
    const res = await requestApi("/movies", { method: "POST", body });
    if (res.ok) {
      getMovies();
      setCreateMov(false);
    } else {
      setCreateMovErr("Error al crear película. Intente nuevamente.");
    }
    setLoadingM(false);
  };

  const ToggleEditMov = async (id) => {
    if(editMov === id) {
        return
    }
    setEditMov(id)
  }
  
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    const { name, capacity } = e.target;
    const body = {
        name: name.value,
        capacity: parseInt(capacity.value)
    };
    setLoadingRoom(true);
    setCreateRoomErr(false);
    const res = await requestApi("/rooms", { method: "POST", body });
    if (res.ok) {
      getRooms();
      setCreateRoom(false);
    } else {
      setCreateRoomErr("Error al crear sala. Intente nuevamente.");
    }
    setLoadingRoom(false)
  }

  const handleCreateFunction = async (e) => {
    e.preventDefault();
    const { movie_id, room_id, datetime, price } = e.target;
    const body = {
        movie_id: movie_id.value,
        room_id: room_id.value,
        datetime: datetime.value,
        price: parseInt(price.value)
    };
    setLoadingFun(true);
    setCreateFunErr(false);
    const res = await requestApi("/functions", { method: "POST", body });
    if (res.ok) {
      getFunctions();
      setCreateFun(false);
    } else {
        if(res.error?.error) {
            setCreateFunErr("Error: " + res.error.error)
        } else {
            setCreateFunErr("Error al crear funcion. Intente nuevamente.");
        }
    }
    setLoadingFun(false)
  }

  return (
    <div>
      <h3 className="text-3xl mb-5">Estadísticas</h3>
      {statsErr ? (
        <div className="bg-dark p-3">
          <h3 className="text-xl text-rose-700 mb-1 ">{statsErr}</h3>
          <button
            onClick={getStatistics}
            className="px-5 py-3 rounded bg-sky-700 hover:bg-sky-600 cursor-pointer"
          >
            Recargar
          </button>
        </div>
      ) : (
        stats && (
          <div className="bg-dark p-3">
            <p>
              Total de usuarios: <span>{stats.total_users}</span>
            </p>
            <p>
              Total de peliculas: <span>{stats.total_movies}</span>
            </p>
            <p>
              Total de compras: <span>{stats.total_purchases}</span>
            </p>
            <p>
              Total de ganancias: <span>{stats.total_revenue}</span>
            </p>
            <p>
              Compras de hoy: <span>{stats.today_purchases}</span>
            </p>
          </div>
        )
      )}
      <h3 className="text-3xl mb-5 mt-5">Informes</h3>
      {createReport ? (
        <div>
          <form onSubmit={handleReport} className="flex flex-col gap-3">
            <div>
              <p>Tipo:</p>
              <select
                required
                name="type"
                className="outline-none w-full px-5 py-3 rounded-xl border border-salmon hover:bg-purple-950 focus:bg-purple-950 transition"
              >
                <option value="">Eliga el tipo</option>
                <option value="sales">Ventas</option>
                <option value="attendance">Asistencia</option>
              </select>
            </div>
            <div>
              <p>Fecha inicial:</p>
              <input
                required
                type="date"
                name="start_date"
                className="outline-none w-full px-5 py-3 rounded-xl border border-salmon hover:bg-purple-950 focus:bg-purple-950 transition"
              />
            </div>
            <div>
              <p>Fecha final:</p>
              <input
                required
                type="date"
                name="end_date"
                className="outline-none w-full px-5 py-3 rounded-xl border border-salmon hover:bg-purple-950 focus:bg-purple-950 transition"
              />
            </div>
            {reportErr && <p className="text-rose-700 my-5">{reportErr}</p>}
            <div className="flex gap-3">
              <button
                disabled={loadingRe}
                className="disabled:opacity-70 px-5 py-3 rounded-xl bg-sky-700 text-corn hover:bg-sky-600 transition"
              >
                Generar
              </button>
              <button
                type="button"
                onClick={() => setCreateReport(false)}
                className="px-5 py-3 rounded-xl bg-rose-600 text-corn hover:bg-rose-500 transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div>
          <button
            onClick={() => setCreateReport(true)}
            className="px-5 py-3 rounded-xl bg-salmon text-corn hover:bg-corn hover:text-salmon transition"
          >
            Crear Informe
          </button>
        </div>
      )}

      <h3 className="text-3xl mb-5 mt-5">Registro de actividad</h3>
      <div className="bg-dark rounded overflow-auto p-2 w-full h-[500px]">
        {logsErr ? (
          <div>
            <h3 className="text-xl text-rose-700 mb-1 ">{logsErr}</h3>
            <button
              onClick={getLogs}
              className="px-5 py-3 rounded bg-sky-700 hover:bg-sky-600 cursor-pointer"
            >
              Recargar
            </button>
          </div>
        ) : (
          logs && (
            <div className="flex flex-col gap-1">
              {logs.map((val, i) => (
                <div key={val.id} className="p-3 border-b ">
                  <p>
                    Usuario: <span>{val.user_email}</span>
                  </p>
                  <p>
                    Acción: <span>{val.action}</span>
                  </p>
                  <p>
                    Detalles: <span>{val.details}</span>
                  </p>
                  <p>
                    Fecha: <span>{val.timestamp}</span>
                  </p>
                  <p>
                    I.P: <span>{val.ip_address}</span>
                  </p>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      <h3 className="text-3xl mb-5 mt-5">Películas</h3>
      {createMovie ? (
        <div>
          <form onSubmit={handleCreateMov} className="flex flex-col gap-3">
            <div>
              <p>Título:</p>
              <input
                required
                type="text"
                name="title"
                className="outline-none w-full px-5 py-3 rounded-xl border border-salmon hover:bg-purple-950 focus:bg-purple-950 transition"
              />
            </div>
            <div>
              <p>Sinopsis:</p>
              <input
                required
                type="text"
                name="synopsis"
                className="outline-none w-full px-5 py-3 rounded-xl border border-salmon hover:bg-purple-950 focus:bg-purple-950 transition"
              />
            </div>
            <div>
              <p>Duración (En minutos):</p>
              <input
                required
                type="number"
                min={1}
                name="duration"
                className="outline-none w-full px-5 py-3 rounded-xl border border-salmon hover:bg-purple-950 focus:bg-purple-950 transition"
              />
            </div>
            <div>
              <p>Clasificación:</p>
              <select
                required
                name="rating"
                className="outline-none w-full px-5 py-3 rounded-xl border border-salmon hover:bg-purple-950 focus:bg-purple-950 transition"
              >
                <option value="">Selecciona una clasificación</option>
                <option value="G">G</option>
                <option value="PG">PG</option>
                <option value="PG-13">PG-13</option>
                <option value="R">R</option>
              </select>
            </div>
            <div>
              <p>Género:</p>
              <input
                type="text"
                name="genre"
                className="outline-none w-full px-5 py-3 rounded-xl border border-salmon hover:bg-purple-950 focus:bg-purple-950 transition"
              />
            </div>
            {createMovErr && (
              <p className="text-rose-700 my-5">{createMovErr}</p>
            )}
            <div className="flex gap-3">
              <button
                disabled={loadingM}
                className="disabled:opacity-70 px-5 py-3 rounded-xl bg-sky-700 text-corn hover:bg-sky-600 transition"
              >
                Generar
              </button>
              <button
                type="button"
                onClick={() => setCreateMov(false)}
                className="px-5 py-3 rounded-xl bg-rose-600 text-corn hover:bg-rose-500 transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div>
          <button
            onClick={() => setCreateMov(true)}
            className="px-5 py-3 rounded-xl bg-salmon text-corn hover:bg-corn hover:text-salmon transition"
          >
            Crear película
          </button>
        </div>
      )}

      <div className="p-3 bg-dark">
        {movErr ? (
          <div>
            <h3 className="text-xl text-rose-700 mb-1 ">{movErr}</h3>
            <button
              onClick={getMovies}
              className="px-5 py-3 rounded bg-sky-700 hover:bg-sky-600 cursor-pointer"
            >
              Recargar
            </button>
          </div>
        ) : movies && (
          <div className="flex flex-col overflow-auto h-[400px]">
            {
                movies.map(val => (
                    <div onClick={() => ToggleEditMov(val.id)} key={val.id} className="p-3 hover:bg-purple-950 transition border-b border-white cursor-pointer group">
                        <p>Id: {val.id}</p>
                        <p>Título: {val.title}</p>
                        <p>Sinopsis: {val.synopsis.slice(0, 20)}</p>
                        <p>Duración: {val.duration} min</p>
                        <p>Género: {val.genre}</p>
                        <p>Rating: {val.rating}</p>
                    </div>
                ))
            }
          </div>
        )}
      </div>

    <h3 className="text-3xl mb-5 mt-5">Salas</h3>
    {createRoom ? (
        <div>
          <form onSubmit={handleCreateRoom} className="flex flex-col gap-3">
            <div>
              <p>Nombre:</p>
              <input
                required
                type="text"
                name="name"
                className="outline-none w-full px-5 py-3 rounded-xl border border-salmon hover:bg-purple-950 focus:bg-purple-950 transition"
              />
            </div>
            <div>
              <p>Capacidad:</p>
              <input
                required
                type="number"
                name="capacity"
                min={1}
                className="outline-none w-full px-5 py-3 rounded-xl border border-salmon hover:bg-purple-950 focus:bg-purple-950 transition"
              />
            </div>
            
            {createRoomErr && (
              <p className="text-rose-700 my-5">{createRoomErr}</p>
            )}
            <div className="flex gap-3">
              <button
                disabled={loadingRoom}
                className="disabled:opacity-70 px-5 py-3 rounded-xl bg-sky-700 text-corn hover:bg-sky-600 transition"
              >
                Crear
              </button>
              <button
                type="button"
                onClick={() => setCreateRoom(false)}
                className="px-5 py-3 rounded-xl bg-rose-600 text-corn hover:bg-rose-500 transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div>
          <button
            onClick={() => setCreateRoom(true)}
            className="px-5 py-3 rounded-xl bg-salmon text-corn hover:bg-corn hover:text-salmon transition"
          >
            Crear sala
          </button>
        </div>
      )}

      <div className="p-3 bg-dark mt-5">
        {
            rooms.map(val => 
                (
                    <div key={val.id} className="p-3 hover:bg-purple-950 transition border-b border-white cursor-pointer group">
                        <p>id: {val.id}</p>
                        <p>Nombre: {val.name}</p>
                        <p>Capacidad: {val.capacity}</p>
                    </div>
                )
            )
        }
      </div>

    <h3 className="text-3xl mb-5 mt-5">Funciones</h3>
    {createFunction ? (
        <div>
          <form onSubmit={handleCreateFunction} className="flex flex-col gap-3">
            <div>
              <p>Id de película:</p>
              <input
                required
                type="number"
                name="movie_id"
                min={1}
                className="outline-none w-full px-5 py-3 rounded-xl border border-salmon hover:bg-purple-950 focus:bg-purple-950 transition"
              />
            </div>
            <div>
              <p>Id de sala:</p>
              <input
                required
                type="number"
                name="room_id"
                min={1}
                className="outline-none w-full px-5 py-3 rounded-xl border border-salmon hover:bg-purple-950 focus:bg-purple-950 transition"
              />
            </div>
            <div>
              <p>Fecha:</p>
              <input
                required
                type="datetime-local"
                name="datetime"
                min={1}
                className="outline-none w-full px-5 py-3 rounded-xl border border-salmon hover:bg-purple-950 focus:bg-purple-950 transition"
              />
            </div>
            <div>
              <p>Precio:</p>
              <input
                required
                type="number"
                name="price"
                min={1}
                className="outline-none w-full px-5 py-3 rounded-xl border border-salmon hover:bg-purple-950 focus:bg-purple-950 transition"
              />
            </div>
            {createFunErr && (
              <p className="text-rose-700 my-5">{createFunErr}</p>
            )}
            <div className="flex gap-3">
              <button
                disabled={loadingFun}
                className="disabled:opacity-70 px-5 py-3 rounded-xl bg-sky-700 text-corn hover:bg-sky-600 transition"
              >
                Crear
              </button>
              <button
                type="button"
                onClick={() => setCreateFun(false)}
                className="px-5 py-3 rounded-xl bg-rose-600 text-corn hover:bg-rose-500 transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div>
          <button
            onClick={() => setCreateFun(true)}
            className="px-5 py-3 rounded-xl bg-salmon text-corn hover:bg-corn hover:text-salmon transition"
          >
            Crear Función
          </button>
        </div>
      )}
      <div className="p-3 bg-dark">
        {
            functions.map(val => (
                <div key={val.id} className="p-3 hover:bg-purple-950 transition border-b border-white cursor-pointer group">
                        <p>id: {val.id}</p>
                        <p>id. pelicula: {val.movie.id}</p>
                        <p>pelicula: {val.movie.title}</p>
                        <p>id. Sala: {val.room.id}</p>
                        <p>Fecha: {val.datetime}</p>
                        <p>Precio: {val.price}</p>
                        <p>Asientos disponibles: {val.available_seats}</p>
                </div>
            ))
        }
      </div>
    </div>
  );
}

export default AdminDashboard;
