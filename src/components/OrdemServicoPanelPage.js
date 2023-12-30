import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './OrdemServicoPanelPage.css';
import { Buffer } from 'buffer';

function OrdemServicoPanelPage() {
  const [ordensServico, setOrdensServico] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); 


  
  // Função para lidar com o logout
  const handleLogout = () => {
    // Implemente a lógica de logout aqui (limpar autenticação, estado, etc.)

    // Redirecione o usuário para a tela de login
    navigate('/login-tecnico'); // Use navigate() em vez de navigate.push()
  };
  
  
  const downloadOrdemServico = async (numero_ordem) => {
    try {
      const response = await fetch(`http://localhost:5000/api/pdf/${numero_ordem}`);
      const pdfBase64 = await response.text();
  
      // Decodifica o base64 para obter a string binária do PDF
      const pdfData = Buffer.from(pdfBase64, 'base64');
  
      // Cria um objeto URL para o Blob
      const pdfUrl = URL.createObjectURL(new Blob([pdfData], { type: 'application/pdf' }));
  
      // Abre o PDF em uma nova guia
      window.open(pdfUrl, '_blank');
  
      // Libera a URL temporária após abrir o PDF
      URL.revokeObjectURL(pdfUrl);
    } catch (error) {
      console.error('Erro ao buscar detalhes da ordem de serviço:', error.message);
    }
  };
  
  useEffect(() => {
    const fetchOrdensServico = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/ordens_servico');
        if (response.status === 200) {
          const data = response.data;
          setOrdensServico(data);
        } else {
          console.error(`Erro ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.error('Erro ao buscar as ordens de serviço:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrdensServico();
  }, []);


  
  useEffect(() => {
    const eventSource = new EventSource('http://localhost:5000/sse');

    eventSource.onmessage = (event) => {
      const updatedOrder = JSON.parse(event.data);
      setOrdensServico((prevOrders) => {
        const updatedOrders = prevOrders.map((order) =>
          order.numero_ordem === updatedOrder.numero_ordem
            ? { ...order, status: updatedOrder.status }
            : order
        );
        return updatedOrders;
      });
    };

    eventSource.onerror = (error) => {
      console.error('Erro no SSE:', error);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div className='container'>
      <div className='details-container'>
        <h1>Painel de Controle de Ordens de Serviço</h1>
        <button onClick={handleLogout}>Sair</button> {/* Botão de Logout */}
        {loading ? (
          <p>Carregando...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Número de Ordem</th>
                <th>Serviço</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
            {ordensServico.map((ordem) => (
              <tr key={ordem.numero_ordem}>
                <td>
                  {ordem.status === 'Concluída' ? (
                    <a
                      href="#"
                      target="_blank"  // Abre o link em uma nova guia
                      onClick={(e) => {
                        e.preventDefault();
                        downloadOrdemServico(ordem.numero_ordem); // Use a função downloadOrdemServico aqui
                      }}
                    >
                      Ordem de Serviço #{ordem.numero_ordem}
                    </a>
                  ) : (
                      <Link to={`/detalhes/${ordem.numero_ordem}`}>Ordem de Serviço #{ordem.numero_ordem}</Link>
                    )}
                  </td>
                  <td>{ordem.servico.join(', ')}</td>
                  <td
                    className={
                      ordem.status === 'Concluída'
                        ? 'status-concluida'
                        : `status-${ordem.status.toLowerCase()}`
                    }
                    id="statusDaOrdemDeServico"
                  >
                    {ordem.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
 };


export default OrdemServicoPanelPage;