import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import requestApi from "../../helpers/requestApi";

function Profile() {
  const { user, checkAuth } = useAuth();

  const [edit, setEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const { name, age } = e.target;
    if (name.value !== user.user_name || age.value !== String(user.user_age)) {
      setLoading(true);
      const res = await requestApi("/user/profile", {
        method: "PUT",
        body: { name: name.value, age: parseInt(age.value) },
      });
      if (res.ok) {
        await checkAuth();
        setEdit(false);
      } else {
        if (res.error?.error) {
          setMessage("Error: " + res.error.error);
        } else {
          setMessage("Error inesperado. Intente nuevamente.");
        }
      }
      setLoading(false);
    }
  };

  return (
    <>
      {edit ? (
        <div>
          <form onSubmit={handleEditSubmit} className="flex flex-col gap-1">
            <div className="w-full">
              <p>Nombre:</p>
              <input
                required
                type="text"
                defaultValue={user.user_name}
                name="name"
                placeholder="Ingresa el nuevo nombre"
                className="outline-none border border-salmon px-5 py-2 rounded-xl focus:bg-purple-950"
              />
            </div>
            {/* <div className="w-full">
                                <p>Email:</p>
                                <input type="email" name="email" placeholder="Ingresa el nuevo email" className="outline-none border border-salmon px-5 py-2 rounded-xl focus:bg-purple-950" />
                            </div> */}
            <div className="w-full">
              <p>Edad:</p>
              <input
                required
                type="number"
                defaultValue={user.user_age}
                min={1}
                max={100}
                name="age"
                placeholder="Ingresa tu edad"
                className="outline-none border border-salmon px-5 py-2 rounded-xl focus:bg-purple-950"
              />
            </div>
            {/* <div className="w-full">
                                <p>Contraseña:</p>
                                <input type="password" name="password" placeholder="Ingresa tu contraseña" className="outline-none border border-salmon px-5 py-2 rounded-xl focus:bg-purple-950" />
                            </div> */}
            {message && <p className="text-rose-700 my-5">{message}</p>}
            <div className="flex gap-2">
              <button
                disabled={loading}
                className="py-3 px-5 disabled:opacity-70' bg-sky-700 hover:bg-sky-600 text-corn rounded-xl mt-5 transition"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setEdit(false)}
                className="py-3 px-5 bg-rose-500 hover:bg-rose-400 text-corn rounded-xl mt-5 transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div>
          <h3 className="text-3xl">
            Nombre: <span>{user.user_name}</span>
          </h3>
          <p className="text-lg">
            Email: <span>{user.user_email}</span>
          </p>
          <p>
            edad: <span>{user.user_age}</span>
          </p>
          <div>
            <button
              onClick={() => setEdit(true)}
              className="py-3 px-5 bg-sky-700 hover:bg-sky-600 text-corn rounded-xl mt-5 transition"
            >
              Editar
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Main() {
  return <>Main</>;
}

function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [message, setMessage] = useState(false);

  const [selectTicket, setSelectTicket] = useState(null);

  useEffect(() => {
    const getPurchases = async () => {
      const res = await requestApi("/purchase-history");
      setMessage(false);
      if (res.ok) {
        setPurchases(res.data.purchases);
      } else {
        setMessage("Error al cargar las compras.");
      }
    };

    getPurchases();
  }, []);

  const handleSelectTicket = (id) => {
    if (selectTicket === id) {
      setSelectTicket(null);
    } else {
      setSelectTicket(id);
    }
  };

  return (
    <div>
      <div className="flex flex-col">
        {purchases.map((val) => (
          <div
            key={val.id}
            onClick={() => handleSelectTicket(val.id)}
            className="px-5 py-3 hover:bg-purple-950 rounded group cursor-pointer"
          >
            <p className="text-lg">
              Ticket: <span>{val.ticket_code}</span>
            </p>
            {selectTicket === val.id ? (
              <div>
                <p className="">
                  Pelicula: <span>{val.movie_title}</span>
                </p>
                <p>
                  Fecha de la función: <span>{val.function_date}</span>
                </p>
                <p>
                  Sala: <span>{val.room_name}</span>
                </p>
                <p>
                  Acientos: <span>{val.seats}</span>
                </p>
                <p className="">
                  Fecha de Compra: <span>303-232-33</span>
                </p>
                <p>
                  Total: <span>${val.total_amount}</span>
                </p>
                <p>Codigo Qr:</p>
                <div className="w-[200px] h-[200px] bg-white">
                  <img
                    src={`data:image/png;base64,${val.qr_code}`}
                    alt="QR Code"
                    style={{ width: "200px", height: "200px" }}
                  />
                </div>
                <p className="group-hover:underline">Ver menos...</p>
              </div>
            ) : (
              <div>
                <div className="opacity-80">
                  <p className="text-sm">
                    Pelicula: <span>{val.movie_title}</span>
                  </p>
                  <p className="text-sm">
                    Fecha de Compra: <span>{val.purchase_date}</span>
                  </p>
                </div>
                <p className="group-hover:underline">Ver más...</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export { Main, Profile, Purchases };
