import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom'; 
import './LoginRequisitante.css';

const LoginRequisitante = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const navigate = useNavigate(); // Use o useNavigate para navegar para a próxima tela após a autenticação


  const handleLogin = async (event) => {
    event.preventDefault();

    try {
      // Enviar as credenciais para o servidor para autenticação
      const response = await axios.post('http://localhost:5000/api/login', {
        username,
        password,
      });

      console.log('Resposta do servidor:', response.data);


      // Verificar a resposta do servidor
      if (response.data.message === 'Autenticação bem-sucedida') {
        // Autenticação bem-sucedida, chamar a função onLogin para permitir o acesso à próxima tela
        localStorage.setItem('id_requisitante', response.data.userID);
        console.log('ID do requisitante cadastrado:', response.data.userID);
        onLogin();
        navigate('/ordem-servico'); 
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
        <h2>Tela de Login</h2>
        <div>
          <label>Login:</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div>
          <label>Senha:</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button type="submit">Entrar</button>
        <p>Não tem uma conta? <Link to="/cadastro">Crie uma aqui.</Link></p> {/* Adicione o link para a tela de cadastro */}
      </form>
    </div>
  );
};




export default LoginRequisitante;