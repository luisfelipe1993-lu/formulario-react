// App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes,Navigate } from 'react-router-dom';
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
          path="/formulario-react/"
          element={<Navigate to="/login" />}
        />
        <Route
          path="/formulario-react/login"
          element={<LoginRequisitante onLogin={handleLogin} onToggleForm={handleToggleForm} />}
        />
        <Route
          path="/formulario-react/cadastro"
          element={<CadastroRequisitante onRegister={handleRegister} onToggleForm={handleToggleForm} />}
        />
        <Route
          path="/formulario-react/login-tecnico"
          element={<LoginTecnico onLoginTecnico={handleLogin} onToggleForm={handleToggleForm} />}
        />
        <Route
          path="/formulario-react/cadastro-tecnico"
          element={<CadastroTecnico onRegisterTecnico={handleRegister} onToggleForm={handleToggleForm} />}
        />
        <Route
          path="/formulario-react/painel-de-controle"
          element={<OrdemServicoPanelPage />}
        />
        {loggedIn && (
          <Route path="/formulario-react/ordem-servico" element={<OrdemServicoForm />} />
        )}
        {loggedIn && (
          <Route path="/formulario-react/detalhes/:numero_ordem" element={<OrdemServicoDetalhes />} />
        )}
        {loggedIn && (
          <Route path="/formulario-react/administrar-usuarios" element={<UsersAdminPage />} />
        )}
        {loggedIn && (
          <Route path="/formulario-react/minhas-ordens" element={<MinhasOrdensPage />} />
        )}
        <Route
          path="/formulario-react/login-analista"
          element={<LoginAnalista onLogin={handleLogin} onToggleForm={handleToggleForm}/>}
        />
        <Route
          path="/formulario-react/*"
          element={<NotFoundPage />}
        />
      </Routes>
    </Router>
  );
 };

export default App;