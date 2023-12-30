import React, { useState} from 'react';
import './OrdemServicoForm.css';
import axios from 'axios';
import {useNavigate} from 'react-router-dom';
import jsPDF from 'jspdf';
import imagemCheckboxMarcada from '../images/marcada.png';
import imagemCheckboxDesmarcada from '../images/desmarcada.png';
import imagemLogo from '../images/brazao.jpg'; 
import imagemLogoSecretaria from '../images/SecretariaAdministração.jpg'; 
import { Link } from 'react-router-dom';
import { Buffer } from 'buffer';

const OrdemServicoForm = () => {
  
  const [secretaria, setSecretaria] = useState('');
  const [prioridade, setPrioridade] = useState('');
  const [data_agendamento, setDataAgendamento] = useState('');
  const [horario_agendamento, setHorarioAgendamento] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [manutencao, setManutencao] = useState([]);
  const [servico, setServico] = useState([]);
  const [descricao_solicitacao, setDescricaoSolicitacao] = useState('');
  const id_requisitante = localStorage.getItem("id_requisitante");
  const [numero_ordem] = useState('');
  const { format } = require('date-fns');
  const navigate = useNavigate();

  console.log('Valor de id_requisitante em OrdemServicoForm:', id_requisitante);
  
  const handleReturn = () => {
    
    navigate('/login');
  };

  const handleManutencaoChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setManutencao((prevManutencao) => [...prevManutencao, value]);
    } else {
      setManutencao((prevManutencao) =>
        prevManutencao.filter((item) => item !== value)
      );
    }
  };

  const handleServicoChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setServico((prevServico) => [...prevServico, value]);
    } else {
      setServico((prevServico) => prevServico.filter((item) => item !== value));
    }
  };

  const isDataHoraRetroativa = (data, hora) => {
    const dataHoraAtual = new Date();
    const dataHoraSelecionada = new Date(`${data}T${hora}`);
    return dataHoraSelecionada < dataHoraAtual;
  };



  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('Secretaria:', secretaria);
    console.log('Prioridade:', prioridade);
    console.log('Data da Requisição:', data_agendamento);
    console.log('Horário da Requisição:', horario_agendamento);
    console.log('Responsável:', responsavel);
    console.log('Manutenção:', manutencao);
    console.log('Serviço:', servico);
    console.log('Descrição da Solicitação:', descricao_solicitacao);

    if (!secretaria || !prioridade || !data_agendamento || !horario_agendamento || !responsavel || !manutencao.length || !servico.length || !descricao_solicitacao) {
      alert('Por favor, preencha todos os campos.');
      return;
    }

    if (isDataHoraRetroativa(data_agendamento)) {
      alert('Não é permitido selecionar datas retroativas.');
      return;
    }

    try {
    

      // Crie o objeto ordemServico com id_requisitante definido
      const ordemServico = {
        secretaria,
        prioridade,
        data_agendamento,
        horario_agendamento,
        responsavel,
        manutencao: JSON.stringify(manutencao),
        servico: JSON.stringify(servico),
        descricao_solicitacao,
        id_requisitante: id_requisitante, // Defina o id_requisitante aqui
      };
    
      const response = await axios.post('http://localhost:5000/api/ordens_servico', ordemServico);
      const novaOrdemServico = response.data;
    
      console.log('Ordem de serviço adicionada com sucesso!', novaOrdemServico);

      // Atualize a ordem de serviço no banco de dados com o pdf_data
      const pdfData = await generatePDF(novaOrdemServico.numero_ordem, secretaria, prioridade, data_agendamento, horario_agendamento, responsavel, manutencao, servico, descricao_solicitacao);

      await axios.put(`http://localhost:5000/api/ordens_servico/${novaOrdemServico.numero_ordem}`, {
      pdf_data: pdfData,
      });

    
      // Exibir mensagem de sucesso com o número da ordem de serviço gerado
      alert(`Ordem de Serviço gerada com sucesso! Número da Ordem: ${novaOrdemServico.numero_ordem}`);
    
    
      // Salvar os dados temporariamente no localStorage
      localStorage.setItem(
        'ordemServicoData',
        JSON.stringify({
          numero_ordem: novaOrdemServico.numero_ordem,
          secretaria,
          prioridade,
          data_agendamento,
          horario_agendamento,
          responsavel,
          manutencao,
          servico,
          descricao_solicitacao,
        })
      );
      // Limpar os campos do formulário
    
      setSecretaria('');
      setPrioridade('');
      setDataAgendamento('');
      setHorarioAgendamento('');
      setResponsavel('');
      setManutencao([]);
      setServico([]);
      setDescricaoSolicitacao('');
    
    
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Erro de rede ou conexão
        console.error('Erro de conexão ao adicionar ordem de serviço:', error.message);
      } else {
        // Outro tipo de erro
        console.error('Erro ao adicionar ordem de serviço:', error);
      }
    }
  }    

    
const generatePDF =  async (numero_ordem, secretaria, prioridade, data_agendamento, horario_agendamento, responsavel, manutencao, servico, descricao_solicitacao) => {
 try{
  const doc = new jsPDF();
  const imgWidth = 180;
  const imgHeight = 120;
  let currentY = 40;
  const pageWidth = doc.internal.pageSize.getWidth();

  const drawCheckbox = (x, y, isChecked) => {
    if (isChecked) {
      doc.addImage(imagemCheckboxMarcada, x, y, 5, 5);
    } else {
      doc.addImage(imagemCheckboxDesmarcada, x, y, 5, 5);
    }
  };


  const centerText = (doc, text, y, fontSize = 12, isBold = false) => {
    const textWidth = doc.getStringUnitWidth(text) * fontSize / doc.internal.scaleFactor;
    const pageWidth = doc.internal.pageSize.getWidth();
    const x = (pageWidth - textWidth) / 2;

    doc.setFont('helvetica');
    if (isBold) {
      doc.setFont(undefined, 'bold');
    }

    doc.setFontSize(fontSize);
    doc.text(x, y, text);
  };

  const leftText = (doc, text, x, y, fontSize = 12) => {
    doc.setFontSize(fontSize);
    doc.text(text, x, y);
  };

  const logoWidth = 60; // Largura da imagem da logo (ajuste conforme necessário)
  const logoHeight = 40; // Altura da imagem da logo (ajuste conforme necessário)
  doc.addImage(imagemLogo, 'JPG', 10, 10, logoWidth, logoHeight);

     
  // Posição para o segundo logotipo (canto superior direito)
  const logoSecretariaWidth = 35;
  const logoSecretariaHeight = 35;
  const logoSecretariaX = pageWidth - logoSecretariaWidth - 10; // Ajuste a coordenada X para posicionar o logotipo
  const logoSecretariaY = 15; // Ajuste a coordenada Y para posicionar o logotipo
  doc.addImage(imagemLogoSecretaria, 'JPG', logoSecretariaX, logoSecretariaY, logoSecretariaWidth, logoSecretariaHeight);

  // Adicionar os dados do formulário ao PDF
  centerText(doc, 'Ordem de Serviço', currentY, 18, true);
  currentY += 20;
  const numeroText = `Número da Ordem: ${numero_ordem}`;
  leftText(doc, numeroText, 10, currentY, 12); // Alinha à esquerda
  const numeroTextWidth = doc.getStringUnitWidth(numeroText) * 12 / doc.internal.scaleFactor;
  doc.setLineWidth(0.5);
  doc.line(50, currentY + 1, 10 + numeroTextWidth, currentY + 1); // Linha abaixo do número
  currentY += 0; // Espaço entre o número e a próxima seção
  
  const manutencaoOptions = ["Corretiva", "Preventiva", "Preditiva"];
  const servicoOptions = ["Informatica", "Eletrico", "Limpeza", "Seguranca do Trabalho"];

  doc.setFontSize(12);
  doc.text("Manutenção:", 10, currentY + 15);

  const checkboxXStart = 40; // Valor inicial de posicionamento horizontal
  const checkboxY = currentY + 11; // Coordenada Y das opções de checkbox
  const checkboxSpacing = 40; // Espaçamento entre as opções

  manutencaoOptions.forEach((option, index) => {
  const checkboxX = checkboxXStart + index * checkboxSpacing;

  drawCheckbox(checkboxX, checkboxY, manutencao.includes(option));
  doc.text(option, checkboxX + 8, checkboxY + 4); // Ajuste as coordenadas do texto
 });
  currentY += 17;


 const checkboxXStartServico = 32; // Valor inicial de posicionamento horizontal para os checkboxes de serviço
 const checkboxYServico = currentY + 11; // Coordenada Y das opções de checkbox de serviço
 const checkboxSpacingServico = 40; // Espaçamento entre as opções de checkbox de serviço

 doc.setFontSize(12);
 doc.text("Serviço:", 10, currentY + 15);

 servicoOptions.forEach((option, index) => {
   const checkboxXServico = checkboxXStartServico + index * checkboxSpacingServico;

   drawCheckbox(checkboxXServico, checkboxYServico, servico.includes(option));
   doc.text(option, checkboxXServico + 8, checkboxYServico + 4); // Ajuste as coordenadas do texto
 });
   currentY += 45; // Espaço entre os checkboxes de serviço e o próximo campo
     
   const secretariaText = `Secretaria: ${secretaria}`;
   const secretariaTextWidth = doc.getStringUnitWidth(secretariaText) * 12 / doc.internal.scaleFactor;
   const secretariaTextHeight = -11;

   // Defina as coordenadas X e Y da opção de Secretaria
   const secretariaOptionX = 10;
   const secretariaOptionY = currentY - 10;

   // Encontre a largura da opção de Secretaria selecionada
   const secretariaOptionWidth = doc.getStringUnitWidth(secretaria) * 12 / doc.internal.scaleFactor + 1;

   // Ajuste a coordenada X inicial para alinhar à direita da opção "Secretaria:"
   const linhaPosX = secretariaOptionX + doc.getStringUnitWidth("Secretaria:") * 12 / doc.internal.scaleFactor + 1.2;

   // Encontre a coordenada X final para o traço da linha (linhaFinalX) baseado na largura da opção de secretaria
   const linhaFinalX = linhaPosX + secretariaOptionWidth;

   // Ajuste a coordenada Y da linha para que ela fique logo abaixo da opção de secretaria
   const linhaPosY = secretariaOptionY + 1; // Ajuste vertical para posicionar a linha abaixo da opção

   // Desenhe a linha
   doc.setLineWidth(0.5);
   doc.line(linhaPosX, linhaPosY, linhaFinalX, linhaPosY);

   // Posicione o texto da opção de Secretaria acima da linha
   leftText(doc, secretariaText, secretariaOptionX, secretariaOptionY);

   // Ajustar a coordenada Y para a próxima seção (Responsável)
   currentY = linhaPosY + 30; // Ajuste o valor conforme necessário para o espaço entre as seções (Secretaria e Responsável)

   // Ajuste os valores conforme necessário para atender ao seu layout
   const responsavelText = `Responsável: ${responsavel}`;
   const responsavelTextWidth = doc.getStringUnitWidth(responsavelText) * 12 / doc.internal.scaleFactor;
   const responsavelTextHeight = -11;

   // Defina as coordenadas X e Y da opção de Responsável
   const responsavelOptionX = 10;
   const responsavelOptionY = currentY - 10;

   // Encontre a largura da opção de Responsável selecionada
   const responsavelOptionWidth = doc.getStringUnitWidth(responsavel) * 12 / doc.internal.scaleFactor + 1;

   // Ajuste a coordenada X inicial para alinhar à direita da opção "Responsável:"
   const linhaPosResponsavelX = responsavelOptionX + doc.getStringUnitWidth("Responsável:") * 12 / doc.internal.scaleFactor + 1; // Ajuste para mover um pouco mais para a direita

   // Encontre a coordenada X final para o traço da linha (linhaFinalResponsavelX) baseado na largura da opção de responsável
   const linhaFinalResponsavelX = linhaPosResponsavelX + responsavelOptionWidth;

   // Ajuste a coordenada Y da linha para que ela fique próximo da opção de responsável
   const linhaPosResponsavelY = responsavelOptionY + 1; // Ajuste vertical para posicionar a linha logo abaixo da opção

   // Desenhe a linha abaixo da opção de Responsável
   doc.setLineWidth(0.5);
   doc.line(linhaPosResponsavelX, linhaPosResponsavelY, linhaFinalResponsavelX, linhaPosResponsavelY);

  // Posicione o texto da opção de Responsável acima da linha
  leftText(doc, responsavelText, responsavelOptionX, responsavelOptionY);

 // Ajustar a coordenada Y para a próxima seção (Data de Agendamento)
  currentY = linhaPosResponsavelY + 30; // Ajuste o valor conforme necessário para o espaço entre as seções (Responsável e Data de Agendamento)

  
    // Ajuste os valores conforme necessário para atender ao seu layout
    const prioridadeText = `Prioridade: ${prioridade}`;
    const prioridadeTextWidth = doc.getStringUnitWidth(prioridadeText) * 12 / doc.internal.scaleFactor;
    const prioridadeTextHeight = -11;

    // Defina as coordenadas X e Y da opção de Prioridade
    const prioridadeOptionX = linhaFinalResponsavelX + 10; // Posiciona à direita do campo "Responsável"
    const prioridadeOptionY = responsavelOptionY; // Mantém a mesma coordenada Y do campo "Responsável"

    // Encontre a largura da opção de Prioridade selecionada
    const prioridadeOptionWidth = doc.getStringUnitWidth(prioridade) * 12 / doc.internal.scaleFactor + 1;

    // Ajuste a coordenada X inicial para alinhar à direita da opção "Prioridade:"
    const linhaPosPrioridadeX = prioridadeOptionX + doc.getStringUnitWidth("Prioridade:") * 12 / doc.internal.scaleFactor + 1; // Ajuste para mover um pouco mais para a direita

    // Encontre a coordenada X final para o traço da linha (linhaFinalPrioridadeX) baseado na largura da opção de prioridade
    const linhaFinalPrioridadeX = linhaPosPrioridadeX + prioridadeOptionWidth;

    // Ajuste a coordenada Y da linha para que ela fique próximo da opção de prioridade
    const linhaPosPrioridadeY = prioridadeOptionY + 1; // Ajuste vertical para posicionar a linha logo abaixo da opção

    // Desenhe a linha abaixo da opção de Prioridade
    doc.setLineWidth(0.5);
    doc.line(linhaPosPrioridadeX, linhaPosPrioridadeY, linhaFinalPrioridadeX, linhaPosPrioridadeY);

    // Posicione o texto da opção de Prioridade acima da linha
    leftText(doc, prioridadeText, prioridadeOptionX, prioridadeOptionY);

    // Ajustar a coordenada Y para a próxima seção (Data de Agendamento)
    currentY = Math.max(linhaPosResponsavelY, linhaPosPrioridadeY) + 30; // Ajuste o valor conforme necessário para o espaço entre as seções (Prioridade/Responsável e Data de Agendamento)
 

    
 const dataAgendamentoText = `Data de Agendamento: ${format(new Date(data_agendamento), 'dd/MM/yyyy')}`;
 const dataAgendamentoTextWidth = doc.getStringUnitWidth(dataAgendamentoText) * 12 / doc.internal.scaleFactor;
 const dataAgendamentoTextHeight = -11;

 // Defina as coordenadas X e Y da opção de Data de Agendamento
 const dataAgendamentoOptionX = 10;
 const dataAgendamentoOptionY = currentY - 10;

 // Encontre a largura da opção de Data de Agendamento
 const dataAgendamentoOptionWidth = doc.getStringUnitWidth(format(new Date(data_agendamento), 'dd/MM/yyyy')) * 12 / doc.internal.scaleFactor;

 // Ajuste a coordenada X inicial para alinhar à direita da opção "Data de Agendamento:"
 const linhaPosDataAgendamentoX = dataAgendamentoOptionX + doc.getStringUnitWidth("Data de Agendamento:") * 12 / doc.internal.scaleFactor + 2; // Ajuste para mover um pouco mais para a direita

 // Encontre a coordenada X final para o traço da linha (linhaFinalDataAgendamentoX) baseado na largura da opção de Data de Agendamento
 const linhaFinalDataAgendamentoX = linhaPosDataAgendamentoX + dataAgendamentoOptionWidth;

 // Ajuste a coordenada Y da linha para que ela fique próximo da opção de Data de Agendamento
 const linhaPosDataAgendamentoY = dataAgendamentoOptionY + 1; // Ajuste vertical para posicionar a linha logo abaixo da opção

 // Desenhe a linha abaixo da opção de Data de Agendamento
 doc.setLineWidth(0.5);
 doc.line(linhaPosDataAgendamentoX, linhaPosDataAgendamentoY, linhaFinalDataAgendamentoX, linhaPosDataAgendamentoY);

 // Posicione o texto da opção de Data de Agendamento acima da linha
 leftText(doc, dataAgendamentoText, dataAgendamentoOptionX, dataAgendamentoOptionY);

       // Ajuste a coordenada X e Y para a próxima seção (Horário de Agendamento)
      const horarioAgendamentoX = pageWidth / 2;
      const horarioAgendamentoY = linhaPosDataAgendamentoY - 1; // Ajuste vertical para alinhar com a linha de Data de Agendamento
      leftText(doc, `Horário de Agendamento: ${horario_agendamento}`, horarioAgendamentoX, horarioAgendamentoY);

      // Encontre a largura da opção de Horário de Agendamento
     const horarioAgendamentoOptionWidth = doc.getStringUnitWidth(`Horário de Agendamento: ${horario_agendamento}`) * 12 / doc.internal.scaleFactor;

     // Ajuste a coordenada X inicial para alinhar à direita da opção "Horário de Agendamento:"
     const linhaPosHorarioAgendamentoX = horarioAgendamentoX + horarioAgendamentoOptionWidth - 10; // Ajuste para mover um pouco mais para a direita

    // Encontre o tamanho reduzido da linha (10 unidades de comprimento)
    const tamanhoLinhaReduzido = 10;

    // Ajuste a coordenada Y da linha para que ela fique logo abaixo da opção de Horário de Agendamento
    const linhaPosHorarioAgendamentoY = horarioAgendamentoY + 1; // Ajuste vertical para posicionar a linha logo abaixo da opção

    // Desenhe a linha abaixo da opção de Horário de Agendamento (ajuste o tamanho da linha)
    doc.setLineWidth(0.5);
    doc.line(linhaPosHorarioAgendamentoX, linhaPosHorarioAgendamentoY, linhaPosHorarioAgendamentoX + tamanhoLinhaReduzido, linhaPosHorarioAgendamentoY);

    // Ajustar a coordenada Y para a próxima seção (outras seções, se houver)
    currentY = linhaPosHorarioAgendamentoY + 30; // Ajuste o valor conforme necessário para o espaço entre as seções (Horário de Agendamento e a próxima seção)

         
// Função para desenhar um retângulo cinza com o título
function drawGrayRectangleWithText(doc, x, y, width, text) {
  doc.setFillColor(100, 100, 100); // Defina a cor de preenchimento para cinza claro
  doc.rect(x, y, width, 10, 'F'); // Desenha o retângulo

  doc.setFontSize(20); // Tamanho da fonte
  doc.setTextColor(255, 255, 255); // Cor do texto

  const textWidth = doc.getStringUnitWidth(text) * 20 / doc.internal.scaleFactor;
  const textX = x + (width - textWidth) / 2;
  const textY = y + 7; // Ajuste a posição vertical do texto
  doc.text(text, textX, textY);

  // Limpa a cor de preenchimento para evitar retângulo escuro abaixo do texto
  doc.setFillColor(255, 255, 255); // Cor de preenchimento branca
}

      // Posicione o campo "Descrição da Solicitação" com destaque
      doc.setFontSize(14); // Aumente o tamanho da fonte
      doc.setFont(undefined, 'bold') // Defina o estilo da fonte como negrito
      doc.setTextColor(64, 64, 64); // Defina uma cor cinza escura

      // Posicione o campo "Descrição da Solicitação" com destaque um pouco mais acima
      const retanguloX = 0; // Defina como 0 para começar desde a margem esquerda
      const retanguloY = currentY + 10; // Ajuste a coordenada Y para cima
      const retanguloWidth = doc.internal.pageSize.getWidth(); // Largura do retângulo igual à largura da página
      const retanguloHeight = 10; // Altura do retângulo

      /*// Desenhe o retângulo cinza
      doc.setFillColor(100, 100, 100); // Defina a cor de preenchimento para cinza claro
      doc.rect(retanguloX, retanguloY, retanguloWidth, retanguloHeight, 'F');*/

      // Centralize o texto "Descrição da Solicitação" dentro do retângulo
      doc.setFontSize(20); // Tamanho da fonte
      doc.setTextColor(255, 255, 255); // Cor do texto

      // Renderiza o campo Descrição da Solicitação
     const descricaoSolicitacaoText = "Descrição da Solicitação";
     const descricaoSolicitacaoTextWidth = doc.getStringUnitWidth(descricaoSolicitacaoText) * 20 / doc.internal.scaleFactor;
     const descricaoSolicitacaoTextX = retanguloX + (retanguloWidth - descricaoSolicitacaoTextWidth) / 2;
     const descricaoSolicitacaoTextY = currentY - 25; // Ajuste a posição vertical do texto
     drawGrayRectangleWithText(doc, retanguloX, descricaoSolicitacaoTextY, retanguloWidth, descricaoSolicitacaoText);

     const descricaoSolicitacaoValueX = retanguloX + 10; // Ajuste a posição horizontal
     const descricaoSolicitacaoValueY = descricaoSolicitacaoTextY + 15; // Ajuste a posição vertical
     doc.setFontSize(12);
     doc.setTextColor(0, 0, 0); // Cor do texto preto

     const addTextWithPageBreaks = (doc, text, x, y, maxWidth, lineHeight) => {
      const words = text.split(' ');
      let currentLine = '';
    
    
    
      words.forEach(word => {
        const potentialLine = currentLine + (currentLine ? ' ' : '') + word;
        const lineWidth = doc.getStringUnitWidth(potentialLine) * doc.internal.getFontSize() / doc.internal.scaleFactor;
    
        if (lineWidth <= maxWidth) {
          currentLine = potentialLine;
        } else {
          doc.text(x, y, currentLine);
          y += lineHeight;
          currentLine = word;
          if (y >= doc.internal.pageSize.getHeight() - 10) { // 10 is a margin for safety
            doc.addPage();
            y = 20; // Reset Y coordinate on new page
          }
        }
      });
    
      doc.text(x, y, currentLine);
    };

     const descricaoSolicitacaoLines = doc.splitTextToSize(descricao_solicitacao, retanguloWidth - 20); // 20 é um ajuste para a margem
     addTextWithPageBreaks(doc, descricaoSolicitacaoLines.join(' '), descricaoSolicitacaoValueX, descricaoSolicitacaoValueY, retanguloWidth - 20, 7);

     currentY = descricaoSolicitacaoValueY + descricaoSolicitacaoLines.length * 7 + 15;
    
    doc.save('formulario_ordem_servico.pdf');

    // Converte o PDF para uma string base64 usando Buffer
    const pdfBase64 = Buffer.from(doc.output('arraybuffer')).toString('base64');

    return pdfBase64;
  } catch (error) {
    console.error('Erro ao gerar o PDF:', error);
    throw error;
  }
};

  return (
    <div className="container">
      <form onSubmit={handleSubmit} className="form-container">
        <h2>Formulário de Ordem de Serviço</h2>
        <div>
          <label>Secretaria:</label>
          <select
            value={secretaria}
            onChange={(e) => setSecretaria(e.target.value)}
            required
          >
          <option value="">Selecione uma secretaria</option>
          <option value="Secretaria de Administração">Secretaria de Administração</option>
          <option value="Secretaria de Agricultura e Meio Ambiente">Secretaria de Agricultura e Meio Ambiente</option>
          <option value="Secretaria de Saúde">Secretaria de Saúde</option>
          <option value="Secretaria de Fazenda">Secretaria de Fazenda</option>
          <option value="Secretaria de Desenvolvimento Social">Secretaria de Desenvolvimento Social</option>
          <option value="Secretaria de Obras e Infraestrutura Rural">Secretaria de Obras e Infraestrutura Rural</option>
          <option value="Secretaria de Desenvolvimento Econômico">Secretaria de Desenvolvimento Econômico</option>
          <option value="Secretaria de Educação">Secretaria de Educação</option>
        </select>
      </div>
      <div>
        <label>Prioridade:</label>
        <select
          value={prioridade}
          onChange={(e) => setPrioridade(e.target.value)}
          required
        >
          <option value="">Selecione a prioridade</option>
          <option value="Normal">Normal</option>
          <option value="Urgente">Urgente</option>
        </select>
      </div>
      <div>
        <label>Data da Requisição:</label>
        <input
          type="date"
          value={data_agendamento}
          onChange={(e) => setDataAgendamento(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Horário da Requisição:</label>
        <input
          type="time"
          value={horario_agendamento}
          onChange={(e) => setHorarioAgendamento(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Responsável:</label>
        <input
          type="text"
          value={responsavel}
          onChange={(e) => setResponsavel(e.target.value)}
          required
        />
      </div>
      <div className="checkbox-group">
        <label className="manutencao-label">Manutenção:</label>
        <div className="checkbox-options">
          <div className="checkbox-option label-corretiva">
            <input
              type="checkbox"
              value="Corretiva"
              checked={manutencao.includes('Corretiva')}
              onChange={handleManutencaoChange}
            />
            <label>Corretiva</label>
          </div>
          <div className="checkbox-option">
            <input
              type="checkbox"
              value="Preventiva"
              checked={manutencao.includes('Preventiva')}
              onChange={handleManutencaoChange}
            />
            <label>Preventiva</label>
          </div>
          <div className="checkbox-option">
            <input
              type="checkbox"
              value="Preditiva"
              checked={manutencao.includes('Preditiva')}
              onChange={handleManutencaoChange}
            />
            <label>Preditiva</label>
          </div>
        </div>
      </div>
      <div className="checkbox-group">
        <label className="servico-label">Serviço:</label>
        <div className="checkbox-options">
          <div className="checkbox-option label-informatica">
            <input
              type="checkbox"
              value="Informatica"
              checked={servico.includes('Informatica')}
              onChange={handleServicoChange}
            />
            <label>Informática</label>
          </div>
          <div className="checkbox-option">
            <input
              type="checkbox"
              value="Eletrico"
              checked={servico.includes('Eletrico')}
              onChange={handleServicoChange}
            />
            <label>Elétrico</label>
          </div>
          <div className="checkbox-option label-limpeza">
            <input
              type="checkbox"
              value="Limpeza"
              checked={servico.includes('Limpeza')}
              onChange={handleServicoChange}
            />
            <label>Limpeza</label>
          </div>
          <div className="checkbox-option label-seguranca-trabalho">
            <input
              type="checkbox"
              value="Seguranca do Trabalho"
              checked={servico.includes('Seguranca do Trabalho')}
              onChange={handleServicoChange}
            />
            <label>Segurança do Trabalho</label>
          </div>
        </div>
      </div>
      <hr />
      <div>
        <label>Descrição da Solicitação:</label>
        <textarea
          value={descricao_solicitacao}
          onChange={(e) => setDescricaoSolicitacao(e.target.value)}
          rows={6} 
          required
        />
      </div>
      <div className="button-container">
        <button type="submit" className="button-horizontal">Enviar</button>
        <Link to="/minhas-ordens">
          <button type="button" className="button-minhas-ordens">Minhas Ordens</button>
        </Link>
        <button type="button" onClick={handleReturn}>Sair</button>
      </div>
     </form>
    </div>
  );
};

export default OrdemServicoForm;