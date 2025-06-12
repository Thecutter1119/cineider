import { createContext, useContext, useEffect, useState } from 'react';
import requestApi from '../helpers/requestApi';
import { useLocation, useNavigate } from 'react-router';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const navigate = useNavigate();

  
  const checkAuth = async () => {
    const protectedRoutes = ['/dashboard']
    setLoading(true)
    const res = await requestApi('/session')
    let authStatus = false
    if (res.ok) {
        setUser(res.data.session)
        sessionStorage.setItem("session-data", JSON.stringify(res.data.session))
        authStatus = true
    } else {
        if (res.status === 401 || res.status === 403) {
            console.log('Error Autenticación', res.error)
            setUser(null)
            sessionStorage.removeItem('session-data')
        }
    }
    setLoading(false)

    console.log(location.pathname)
    const isProtected = protectedRoutes.some(path => location.pathname.startsWith(path));

    if (isProtected && !authStatus && !sessionStorage.getItem('session-data')) {
        navigate('/login', {replace: true})
    }
};
  useEffect(() => {
    checkAuth();
  }, [location]);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, checkAuth, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);