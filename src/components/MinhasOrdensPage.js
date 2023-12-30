import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { Buffer } from 'buffer';

function MinhasOrdensPage() {
  const [minhasOrdens, setMinhasOrdens] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Função para lidar com o logout
  const handleLogout = () => {
    // Implemente a lógica de logout aqui (limpar autenticação, estado, etc.)

    // Redirecione o usuário para a tela de login
    navigate('/ordem-servico'); // Use navigate() em vez de navigate.push()
  };

  useEffect(() => {
    const id_requisitante = localStorage.getItem('id_requisitante');

    const fetchMinhasOrdens = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/minhas-ordens/${id_requisitante}`);
        if (response.status === 200) {
          const data = response.data;
          setMinhasOrdens(data);
        } else {
          console.error(`Erro ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.error('Erro ao buscar as ordens de serviço:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMinhasOrdens();
  }, []);

  const downloadOrdemServico = async (numero_ordem) => {
    try {
      const response = await fetch(`http://localhost:5000/api/pdf_usuario_requisitante/${numero_ordem}`);
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
    const eventSource = new EventSource('http://localhost:5000/sse');

    eventSource.onmessage = (event) => {
      const updatedOrder = JSON.parse(event.data);
      setMinhasOrdens((prevOrders) => {
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
    <div className="container">
      <div className='details-container'>
        <h1>Minhas Ordens de Serviço</h1>
        <button onClick={handleLogout}>Voltar</button> {/* Botão de Logout */}
        {loading ? (
          <p>Carregando...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Número da Ordem</th>
                <th>Serviço</th>
              </tr>
            </thead>
            <tbody>
              {minhasOrdens.map((ordem) => (
                <tr key={ordem.numero_ordem}>
                  <td>
                    <a
                      href="#"
                      target="_blank"
                      onClick={(e) => {
                        e.preventDefault();
                        downloadOrdemServico(ordem.numero_ordem);
                      }}
                    >
                      Ordem de Serviço #{ordem.numero_ordem} 
                    </a>
                  </td>
                  <td>{ordem.servico.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
 };

export default MinhasOrdensPage;