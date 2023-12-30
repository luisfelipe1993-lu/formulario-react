// CadastroRequisitante.js
import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom'; 
import './CadastroRequisitante.css';



const CadastroRequisitante = ({ onRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  
  const navigate = useNavigate(); // Use o useNavigate ao invés do useHistory
  
  const handleRegister = async (event) => {
    event.preventDefault();

    // Verificar se os campos de usuário e senha estão preenchidos
    if (!username || !password || !email) {
    alert('Por favor, preencha todos os campos de usuário, email e senha.');
    return;
   }

    try {
      // Enviar as informações de cadastro para o servidor
      const response = await axios.post('http://localhost:5000/api/cadastro', {
        username,
        password,
        email,
      });

      // Verificar a resposta do servidor
      if (response.data.message === 'Cadastro realizado com sucesso!') {
        // Cadastro bem-sucedido, chamar a função onRegister para atualizar o estado e permitir o acesso à próxima tela
        const id_requisitante = response.data.id_requisitante;
        localStorage.setItem('id_requisitante', id_requisitante);
        alert('Cadastro concluído com sucesso!');
        onRegister();
        navigate('/login'); // Use navigate para redirecionar o usuário para a página de login
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
        <div>
          <label>E-mail:</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <button type="submit">Cadastrar</button>
        <p>Já tem uma conta? <Link to="/">Faça login aqui.</Link></p> {/* Adicione o link para a tela de login */}
       
      </form>
    </div>
  );
};

export default CadastroRequisitante;