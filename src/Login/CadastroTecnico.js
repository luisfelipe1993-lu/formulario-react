// CadastroRequisitante.js
import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom'; 
import './CadastroTecnico.css';



const CadastroTecnico = ({ onRegisterTecnico }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const navigate = useNavigate(); // Use o useNavigate ao invés do useHistory
  
  const handleRegister = async (event) => {
    event.preventDefault();

    // Verificar se os campos de usuário e senha estão preenchidos
    if (!username || !password) {
    alert('Por favor, preencha todos os campos de usuário e senha.');
    return;
   }

    try {
      // Enviar as informações de cadastro para o servidor
      const response = await axios.post('http://localhost:5000/api/cadastro-tecnico', {
        username,
        password,
      });

      // Verificar a resposta do servidor
      if (response.data.message === 'Cadastro do técnico realizado com sucesso!') {
        // Cadastro bem-sucedido, chamar a função onRegister para atualizar o estado e permitir o acesso à próxima tela
        alert('Cadastro concluído com sucesso!');
        onRegisterTecnico();
        navigate('/login-tecnico'); // Use navigate para redirecionar o usuário para a página de login
      } else {
        alert('Erro ao realizar o cadastro. Por favor, tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao cadastrar:', error);
      alert('Erro ao cadastrar. Por favor, tente novamente mais tarde.');
    }
  };

  return (
    <div className="container">
      <form onSubmit={handleRegister} className="form-container">
        <h2>Tela de Cadastro</h2>
        <div>
          <label>Login:</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div>
          <label>Senha:</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button type="submit">Cadastrar</button>
        <p>Já tem uma conta? <Link to="/">Faça login aqui.</Link></p> {/* Adicione o link para a tela de login */}
       
      </form>
    </div>
  );
};

export default CadastroTecnico;