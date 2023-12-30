// LoginAnalista.js
import React, { useState } from 'react';
import axios from 'axios';
import './LoginAnalista.css';
import { useNavigate } from 'react-router-dom'; 


const LoginAnalista = ({ onLogin, onToggleForm }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Use o hook useNavigate
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();

    try {
      const response = await axios.post('http://localhost:5000/api/login-analista', {
        username,
        password,
      });

      if (response.data.message === 'Autenticação do analista bem-sucedida') {
        onLogin();
        
        // Utilize o hook de navegação para redirecionar para /administrar-usuarios
        navigate('/administrar-usuarios');
      } else {
        alert('Nome de usuário ou senha incorretos.');
      }
    } catch (error) {
      console.error('Erro ao autenticar:', error);
      alert('Erro ao autenticar. Por favor, tente novamente mais tarde.');
    }
  };

  return (
    <div className="container">
      <form onSubmit={handleLogin} className="form-container">
        <h1>Tela de Login</h1>
        <div>
          <label>Login:</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div>
          <label>Senha:</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button type="submit">Entrar</button>
      </form>
    </div>
  );
};

export default LoginAnalista;