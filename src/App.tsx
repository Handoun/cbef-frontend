import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Chat from './components/Chat';
import Settings from './components/Settings';

function App() {
  const token = localStorage.getItem('token');
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/chat" element={token ? <Chat /> : <Navigate to="/login" />} />
        <Route path="/settings" element={token ? <Settings /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </HashRouter>
  );
}

export default App;