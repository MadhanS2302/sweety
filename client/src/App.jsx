import { useState } from 'react';
import { clearToken, getToken } from './api';
import Auth from './Auth.jsx';
import Dashboard from './Dashboard.jsx';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sweety_user');
    return saved && getToken() ? JSON.parse(saved) : null;
  });

  function handleLogin(u) {
    localStorage.setItem('sweety_user', JSON.stringify(u));
    setUser(u);
  }

  function handleLogout() {
    clearToken();
    localStorage.removeItem('sweety_user');
    setUser(null);
  }

  return (
    <div className="container">
      <header className="header">
        <h1>🍬 Sweety</h1>
        {user && (
          <div className="user">
            <span>Hi, {user.name}</span>
            <button className="btn secondary" onClick={handleLogout}>Log out</button>
          </div>
        )}
      </header>
      {user ? <Dashboard /> : <Auth onLogin={handleLogin} />}
    </div>
  );
}
