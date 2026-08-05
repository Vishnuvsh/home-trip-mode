import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';

const API = 'http://localhost:8001';

interface AuthState {
  token: string | null;
  userId: number | null;
  username: string | null;
}

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  token: null,
  userId: null,
  username: null,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

const getInitialState = (): AuthState => {
  try {
    const token = localStorage.getItem('htt-token');
    const userId = localStorage.getItem('htt-user-id');
    const username = localStorage.getItem('htt-username');
    if (token && userId && username) {
      return { token, userId: parseInt(userId, 10), username };
    }
  } catch {
    // ignore
  }
  return { token: null, userId: null, username: null };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>(getInitialState);

  const persistAuth = (token: string, userId: number, username: string) => {
    localStorage.setItem('htt-token', token);
    localStorage.setItem('htt-user-id', String(userId));
    localStorage.setItem('htt-username', username);
    setAuth({ token, userId, username });
  };

  const login = useCallback(async (username: string, password: string) => {
    const res = await axios.post(`${API}/auth/login`, { username, password });
    const { access_token } = res.data;

    // Decode JWT to get user_id (payload is base64 encoded, middle part)
    const payload = JSON.parse(atob(access_token.split('.')[1]));
    const userId: number = payload.user_id;

    persistAuth(access_token, userId, username);
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    const res = await axios.post(`${API}/auth/register`, { username, password });
    const newUserId: number = res.data.id;

    // Auto-login after register
    const loginRes = await axios.post(`${API}/auth/login`, { username, password });
    persistAuth(loginRes.data.access_token, newUserId, username);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('htt-token');
    localStorage.removeItem('htt-user-id');
    localStorage.removeItem('htt-username');
    setAuth({ token: null, userId: null, username: null });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...auth,
        isAuthenticated: !!auth.token,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
