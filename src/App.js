// App.js
import React, { useState } from 'react';
import { HashRouter as Router, Route, Routes,Navigate } from 'react-router-dom';
import OrdemServicoForm from './components/OrdemServicoForm';
import OrdemServicoDetalhes from './components/OrdemServicoDetalhes';
import LoginRequisitante from './Login/LoginRequisitante';
import CadastroRequisitante from './Login/CadastroRequisitante';
import LoginTecnico from './Login/LoginTecnico';
import CadastroTecnico from './Login/CadastroTecnico';
import OrdemServicoPanelPage from './components/OrdemServicoPanelPage';
import UsersAdminPage from './pages/UsersAdminPage';
import NotFoundPage from './pages/NotFoundPage';
import LoginAnalista from './Login/LoginAnalista';
import MinhasOrdensPage from './components/MinhasOrdensPage';

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [isLoginPage, setIsLoginPage] = useState(true);
  

  const handleLogin = () => {
    setLoggedIn(true);

   

    // Simulando que o usuário analista é autenticado de uma maneira específica
    // Isso pode depender da lógica real de autenticação da sua aplicação
    setIsLoginPage(false);
  };

  const handleLogout = () => {
    setLoggedIn(false);
    
  };

  const handleRegister = () => {
    setLoggedIn(true);

    
  };

  const handleToggleForm = () => {
    setIsLoginPage((prevIsLoginPage) => !prevIsLoginPage);
  };

  return (
    <Router basename='formulario-react'>
      <Routes>
        <Route
          path="/"
          element={<Navigate to="/login" />}
        />
        <Route
          path="/login"
          element={<LoginRequisitante onLogin={handleLogin} onToggleForm={handleToggleForm} />}
        />
        <Route
          path="/cadastro"
          element={<CadastroRequisitante onRegister={handleRegister} onToggleForm={handleToggleForm} />}
        />
        <Route
          path="/login-tecnico"
          element={<LoginTecnico onLoginTecnico={handleLogin} onToggleForm={handleToggleForm} />}
        />
        <Route
          path="/cadastro-tecnico"
          element={<CadastroTecnico onRegisterTecnico={handleRegister} onToggleForm={handleToggleForm} />}
        />
        <Route
          path="/painel-de-controle"
          element={<OrdemServicoPanelPage />}
        />
        {loggedIn && (
          <Route path="/ordem-servico" element={<OrdemServicoForm />} />
        )}
        {loggedIn && (
          <Route path="/detalhes/:numero_ordem" element={<OrdemServicoDetalhes />} />
        )}
        {loggedIn && (
          <Route path="/administrar-usuarios" element={<UsersAdminPage />} />
        )}
        {loggedIn && (
          <Route path="/minhas-ordens" element={<MinhasOrdensPage />} />
        )}
        <Route
          path="/login-analista"
          element={<LoginAnalista onLogin={handleLogin} onToggleForm={handleToggleForm}/>}
        />
        <Route
          path="*"
          element={<NotFoundPage />}
        />
      </Routes>
    </Router>
  );
 };

export default App;