// UsersAdminPage.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {useNavigate} from 'react-router-dom';
import './UsersAdminPage.css';

const UsersAdminPage = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingTechs, setPendingTechs] = useState([]);
  const navigate = useNavigate();

  const handleReturn = () => {
    
    navigate('/login-analista');
  };

  useEffect(() => {
    // Lógica para buscar usuários pendentes do servidor
    console.log('UsersAdminPage montada');
    fetchPendingUsers();
    fetchPendingTechs();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/usuarios-pendentes');
      setPendingUsers(response.data);
    } catch (error) {
      console.error('Erro ao buscar usuários pendentes:', error);
    }
  };

   // Lógica para buscar técnicos pendentes do servidor
   const fetchPendingTechs = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/tecnicos-pendentes');
      setPendingTechs(response.data);
    } catch (error) {
      console.error('Erro ao buscar técnicos pendentes:', error);
    }
  };

  const handleApproveUser = async (id_requisitante) => {
    try {
      await axios.put(`http://localhost:5000/api/aprovar-usuario/${id_requisitante}`);
      // Atualizar a lista de usuários após aprovação
      fetchPendingUsers();
    } catch (error) {
      console.error('Erro ao aprovar usuário:', error);
    }
  };

  const handleRejectUser = async (id_requisitante) => {
    try {
      await axios.put(`http://localhost:5000/api/rejeitar-usuario/${id_requisitante}`);
      // Atualizar a lista de usuários após rejeição
      fetchPendingUsers();
    } catch (error) {
      console.error('Erro ao rejeitar usuário:', error);
    }
  };

  
  const handleApproveTech = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/aprovar-tecnico/${id}`);
      // Atualizar a lista de técnicos após aprovação
      fetchPendingTechs();
    } catch (error) {
      console.error('Erro ao aprovar técnico:', error);
    }
  };

  const handleRejectTech = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/rejeitar-tecnico/${id}`);
      // Atualizar a lista de técnicos após rejeição
      fetchPendingTechs();
    } catch (error) {
      console.error('Erro ao rejeitar técnico:', error);
    }
  };

  return (
    <div className="users-admin-container">
      <h1>Administração de Usuários Pendentes</h1>
      <button onClick={handleReturn}>Sair</button>
      <div className="users-admin-list">
        <div className="table-container">
          <h2 className="table-header">Usuários Pendentes</h2>
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.map((user) => (
                <tr key={user.id_requisitante}>
                  <td>{user.username}</td>
                  <td>
                    <button onClick={() => handleApproveUser(user.id_requisitante)}>Aprovar</button>
                    <button onClick={() => handleRejectUser(user.id_requisitante)}>Rejeitar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
  
        <div className="table-container">
          <h2 className="table-header">Técnicos Pendentes</h2>
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {pendingTechs.map((tech) => (
                <tr key={tech.id}>
                  <td> {tech.username}</td>
                  <td>
                    <button onClick={() => handleApproveTech(tech.id)}>Aprovar</button>
                    <button onClick={() => handleRejectTech(tech.id)}>Rejeitar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
              };


export default UsersAdminPage;