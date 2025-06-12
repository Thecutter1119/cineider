import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import requestApi from "../helpers/requestApi";

function Cartelera() {
  const [movies, setMovies] = useState([]);
  const [movErr, setMovErr] = useState(false)
  const [loading, setloading] = useState(false);

  useEffect(() => {
    const getMovies = async () => {
      setMovErr(false);
      setloading(true)
      const res = await requestApi("/movies");
      if (res.ok) {
        setMovies(res.data.movies);
      } else {
        setMovErr("Error al obtener las peliculas");
      }
      setloading(false)
    };

    getMovies();
  }, []);

  return (
    <div id="main-content">
      <div id="cartelera" className="p-5 lg:p-10">
        <h3 className="text-5xl mb-5">Cartelera</h3>
          {
            loading ? (
              <div className="text-center text-3xl my-10">Cargando</div>
            ) : movErr && (
              <div className="text-center text-3xl my-10 text-rose-700">{movErr}</div>
            ) || (
        <div className="bg-black rounded-lg grid grid-cols-5 overflow-hidden">
          {
            movies.map(val => (
              <Link
                key={val.id}
                to={"/movie/" + val.id}
                className="Card bg-transparent transition hover:bg-[#c33a30] px-3 py-10 group"
              >
                <div className="w-full flex">
                  <div className="bg-gray-500 w-[250px] h-[300px] mx-auto"></div>
                </div>
                <div className="w-full flex flex-col gap-1 text-center mt-3">
                  <h4 className="text-2xl font-bold font-title group-hover:underline">
                    {val.title}
                  </h4>
                  <div className="flex gap-1 items-center justify-center">
                    {
                      val.genre && (
                        <p className="opacity-70 truncate">
                          Genero: <span>{val.genre}</span>
                        </p>
                      )
                    }
                    <p className="text-nowrap">
                      Duración: <span>{val.duration}</span>
                    </p>
                  </div>
                  <p className="opacity-80 text-xs line-clamp-2">
                    {val.synopsis}
                  </p>
                </div>
              </Link>
            ))
          }
        </div>
              
            )
          }
      </div>
    </div>
  );
}

export default Cartelera;
