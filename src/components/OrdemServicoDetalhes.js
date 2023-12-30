import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import './OrdemServicoDetalhes.css';
import jsPDF from 'jspdf';
import imagemCheckboxMarcada from '../images/marcada.png';
import imagemCheckboxDesmarcada from '../images/desmarcada.png';
import imagemLogo from '../images/brazao.jpg'; 
import imagemLogoSecretaria from '../images/SecretariaAdministração.jpg'; 
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Buffer } from 'buffer';



const OrdemServicoDetalhes = ()=> {
  const location = useLocation();
  
  const [diagnostico, setDiagnostico] = useState('');
  const [servicoRealizado, setServicoRealizado] = useState('');
  const [pecasTrocadas, setPecasTrocadas] = useState([]);
  const [relatorioFotograficoAntes, setRelatorioFotograficoAntes] = useState('');
  const [relatorioFotograficoDepois, setRelatorioFotograficoDepois] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(true);
  const [ordensServico, setOrdensServico] = useState([]);
  const [ordemServicoData, setOrdemServicoData] = useState(null);
  const [fotoAntesPreview, setFotoAntesPreview] = useState('');
  const [fotoDepoisPreview, setFotoDepoisPreview] = useState('');
  const [fotosAdicionais, setFotosAdicionais] = useState([]);
  const [fotosAdicionaisPreview, setFotosAdicionaisPreview] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { format } = require('date-fns');
  const numero_ordem = useParams().numero_ordem.toString();
  const navigate = useNavigate();
  const [pdfData, setPdfData] = useState([]);

  
    // Função para lidar com o logout
    const handleReturn = () => {
      // Implemente a lógica de logout aqui (limpar autenticação, estado, etc.)
  
      // Redirecione o usuário para a tela de login
      navigate('/painel-de-controle'); // Use navigate() em vez de navigate.push()
    };
  
  
  const {
    
    secretaria,
    prioridade,
    data_agendamento,
    horario_agendamento,
    responsavel,
    manutencao,
    servico,
    descricao_solicitacao
    // outras propriedades...
  } = ordemServicoData || {};

  let horarioAgendamentoFormatado = ''; // Inicialize com uma string vazia por padrão

  if (horario_agendamento) {
    horarioAgendamentoFormatado = horario_agendamento.replace(/:\d{2}$/, ''); // Remove os segundos
}

  // Função para converter uma imagem em base64
  function convertImageToBase64(file, callback) {
    const reader = new FileReader();
    reader.onloadend = () => {
      callback(reader.result);
    };
    if (file) {
    reader.readAsDataURL(file);
  }
}

  // Função para lidar com a mudança na imagem antes do relatório fotográfico
const handleRelatorioFotograficoAntesChange = (event) => {
  const file = event.target.files[0];
  setRelatorioFotograficoAntes(file);

  convertImageToBase64(file, (base64Data) => {
    setFotoAntesPreview(base64Data);
     // Armazena o caminho da imagem (base64)
  });
};

const handleAdicionarFotoAdicional = (tipo) => {
  const inputElement = document.createElement('input');
  inputElement.type = 'file';
  inputElement.accept = 'image/*';
  inputElement.onchange = (event) => {
    const file = event.target.files[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFotosAdicionais([...fotosAdicionais, { tipo: tipo, image: reader.result }]);
      };
      reader.readAsDataURL(file);
    }
  };
     inputElement.click();
  };

  const handleExcluirFotoAdicional = (index) => {
    const newFotosAdicionais = fotosAdicionais.filter((_, i) => i !== index);
    setFotosAdicionais(newFotosAdicionais);
  };

// Função para lidar com a mudança na imagem depois do relatório fotográfico
const handleRelatorioFotograficoDepoisChange = (event) => {
  const file = event.target.files[0];
  setRelatorioFotograficoDepois(file);

  convertImageToBase64(file, (base64Data) => {
    setFotoDepoisPreview(base64Data);
   // Armazena o caminho da imagem (base64)
  });
};
  
 

  const handleQtdeChange = (event, index) => {
    const { value } = event.target;
    setPecasTrocadas((prevPecasTrocadas) => {
      const updatedPecasTrocadas = [...prevPecasTrocadas];
      updatedPecasTrocadas[index].qtde = value;
      return updatedPecasTrocadas;
    });
  };

  const handleCodigoChange = (event, index) => {
    const { value } = event.target;
    setPecasTrocadas((prevPecasTrocadas) => {
      const updatedPecasTrocadas = [...prevPecasTrocadas];
      updatedPecasTrocadas[index].codigo = value;
      return updatedPecasTrocadas;
    });
  };

  const handleDescricaoChange = (event, index) => {
    const { value } = event.target;
    setPecasTrocadas((prevPecasTrocadas) => {
      const updatedPecasTrocadas = [...prevPecasTrocadas];
      updatedPecasTrocadas[index].descricao = value;
      return updatedPecasTrocadas;
    });
  };

  const handleEstoqueChange = (event, index) => {
    const { value } = event.target;
    setPecasTrocadas((prevPecasTrocadas) => {
      const updatedPecasTrocadas = [...prevPecasTrocadas];
      updatedPecasTrocadas[index].estoqueAlmoxarifado = value;
      return updatedPecasTrocadas;
    });
  };

  const handleAddPeca = () => {
    setPecasTrocadas((prevPecasTrocadas) => [
      ...prevPecasTrocadas,
      { qtde: '', codigo: '', descricao: '', estoqueAlmoxarifado: 'Sim' },
    ]);
  };

  const handleRemovePeca = (index) => {
    setPecasTrocadas((prevPecasTrocadas) => {
      const updatedPecasTrocadas = [...prevPecasTrocadas];
      updatedPecasTrocadas.splice(index, 1);
      return updatedPecasTrocadas;
    });
  };


  // Função para converter o formato da data
  const formatarData = (data) => {
  const dataObj = new Date(data);
  const dia = dataObj.getDate().toString().padStart(2, '0');
  const mes = (dataObj.getMonth() + 1).toString().padStart(2, '0'); // Lembrando que os meses são indexados de 0 a 11, por isso adicionamos 1
  const ano = dataObj.getFullYear();
  return `${dia}/${mes}/${ano}`;
  };
  
 
  useEffect(() => {
    if (numero_ordem) {
      const loadOrderDetails = async () => {
        try {
          const response = await axios.get(`http://localhost:5000/api/ordens_servico/${numero_ordem}`);
          const data = response.data;
  
          setOrdemServicoData(data);
          setLoading(false);
        } catch (error) {
          console.error('Erro ao carregar detalhes da ordem de serviço:', error);
          setLoading(false);
        }
      };
  
      loadOrderDetails();
    }
  }, [numero_ordem]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Verificar se as variáveis têm valor, caso contrário, definir como NULL ou string vazia
    const pecasTrocadasValue = pecasTrocadas.length > 0 ? JSON.stringify(pecasTrocadas) : null;
    const relatorioFotograficoAntesValue = relatorioFotograficoAntes ? relatorioFotograficoAntes : null;
    const relatorioFotograficoDepoisValue = relatorioFotograficoDepois ? relatorioFotograficoDepois : null;

    // Montar o objeto com os dados do formulário
    const formData = {
      numero_ordem: String(numero_ordem),
      diagnostico: diagnostico,
      servico_realizado: servicoRealizado,
      pecas_trocadas: pecasTrocadasValue,
      relatorio_fotografico_antes: relatorioFotograficoAntesValue,
      relatorio_fotografico_depois: relatorioFotograficoDepoisValue,
      observacoes: observacoes,
      pdf_data: await generatePDF(),
    };


    try {
      // Enviar os dados para o servidor
      await axios.post(`http://localhost:5000/api/ordem_servico_detalhes`, formData);

      console.log('Dados salvos com sucesso!');

      // Aqui você pode redirecionar o usuário para a próxima página ou exibir uma mensagem de sucesso
      // Faça o upload do PDF para o servidor
      await concluirOrdemServico(numero_ordem);
      /*await uploadPDF(pdfArrayBuffer);*/

   } catch (error) {
      console.error('Erro ao executar as operações', error);
   }
  };

  // Função para concluir a ordem de serviço
 const concluirOrdemServico = async (numero_ordem) => {
  try {
    await axios.put(`http://localhost:5000/api/ordens_servico/concluir/${numero_ordem}`);
    console.log('Ordem de serviço concluída com sucesso!');
    
    // Atualize o elemento HTML para exibir "Concluída" em verde
    const statusElement = document.getElementById("statusDaOrdemDeServico");
    statusElement.textContent = "Concluída";
    statusElement.classList.remove("status-pendente"); // Remova a classe pendente
    statusElement.classList.add("status-concluida"); // Adicione a classe concluída
    
  } catch (error) {
    console.error('Erro ao concluir a ordem de serviço', error);
  }
};


  // Função para excluir a imagem "Antes"
  const handleExcluirFotoAntes = () => {
    setRelatorioFotograficoAntes(null);
    setFotoAntesPreview(null);
  };

  // Função para excluir a imagem "Depois"
  const handleExcluirFotoDepois = () => {
    setRelatorioFotograficoDepois(null);
    setFotoDepoisPreview(null);
  };
  
  const uploadPDF = async (pdfArrayBuffer) => {
    try {
      console.log('Iniciando upload do PDF para o servidor');
      const formData = new FormData();
      const pdfBlob = new Blob([pdfArrayBuffer], { type: 'application/pdf' });
      formData.append('pdf', pdfBlob, 'detalhes_ordem_servico.pdf');
  
      const response = await axios.post('http://localhost:5000/upload-pdf', formData);
  
      if (response.status === 200) {
        console.log('PDF enviado com sucesso para o servidor');
      } else {
        console.error('Erro ao fazer upload do PDF para o servidor');
        throw new Error('Erro ao fazer upload do PDF para o servidor');
      }
    } catch (error) {
      console.error('Erro ao fazer upload do PDF para o servidor:', error);
      throw error;
    }
  };

    const generatePDF =  async () => {
          try {
           const doc = new jsPDF();
           const imgWidth = 90; // Defina a largura das imagens no PDF
           const imgHeight = 60; // Defina a altura das imagens no PDF
           let currentY = 20; // Definimos a posição inicial Y
           const pageHeight = doc.internal.pageSize.getHeight();
           const pageWidth = doc.internal.pageSize.getWidth()


          function addTextWithPageBreaks(doc, text, x, y, maxWidth, lineHeight) {
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
        }


    // Função para renderizar uma linha da tabela de peças
      function renderPecaTableRow(doc, x, y, rowData) {
        const colWidths = [40, 30, 40, 40, 90]; // Largura das colunas

        rowData.forEach((value, columnIndex) => {
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0); // Cor do texto preto
        doc.rect(x, y, colWidths[columnIndex], 10); // Desenha o retângulo da célula

        const textX = x + 5;
        const textY = y + 7; // Ajuste a posição vertical do texto
        doc.text(value.toString(), textX, textY, { maxWidth: colWidths[columnIndex] - 10, align: 'left' });

        x += colWidths[columnIndex];
      });
     }



    const drawCheckbox = (x, y, isChecked) => {
      if (isChecked) {
        doc.addImage(imagemCheckboxMarcada, x, y, 5, 5);
      } else {
        doc.addImage(imagemCheckboxDesmarcada, x, y, 5, 5);
      }
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
  
    // Função para centralizar o texto no PDF com fonte negrito para o título
    const centerText = (text, y, fontSize = 12, isBold = false) => {
      const textWidth = doc.getStringUnitWidth(text) * fontSize / doc.internal.scaleFactor;
      const pageWidth = doc.internal.pageSize.getWidth();
      const x = (pageWidth - textWidth) / 2;
  
      doc.setFont('helvetica'); // Definimos a fonte padrão como normal
      if (isBold) {
        doc.setFont(undefined, 'bold'); // Definimos a fonte como negrito apenas quando isBold for verdadeiro
      }

      doc.setFontSize(fontSize);
      doc.text(x, y, text);
     };

     const leftText = (doc, text, x, y, fontSize = 12) => {
      doc.setFontSize(fontSize);
      doc.text(text, x, y);
    };
  
     centerText('Detalhes da Ordem de Serviço', currentY + 20, 18, true);
     currentY += 45;
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
    leftText(doc, `Horário de Agendamento: ${horarioAgendamentoFormatado}`, horarioAgendamentoX, horarioAgendamentoY);

    // Encontre a largura da opção de Horário de Agendamento
    const horarioAgendamentoOptionWidth = doc.getStringUnitWidth(`Horário de Agendamento: ${horarioAgendamentoFormatado}`) * 12 / doc.internal.scaleFactor;

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
    currentY = linhaPosHorarioAgendamentoY + 10; // Ajuste o valor conforme necessário para o espaço entre as seções (Horário de Agendamento e a próxima seção)


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
    const descricaoSolicitacaoTextY = currentY - 3; // Ajuste a posição vertical do texto
    drawGrayRectangleWithText(doc, retanguloX, descricaoSolicitacaoTextY, retanguloWidth, descricaoSolicitacaoText);

    const descricaoSolicitacaoValueX = retanguloX + 10; // Ajuste a posição horizontal
    const descricaoSolicitacaoValueY = descricaoSolicitacaoTextY + 15; // Ajuste a posição vertical
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0); // Cor do texto preto

    const descricaoSolicitacaoLines = doc.splitTextToSize(descricao_solicitacao, retanguloWidth - 20); // 20 é um ajuste para a margem
    addTextWithPageBreaks(doc, descricaoSolicitacaoLines.join(' '), descricaoSolicitacaoValueX, descricaoSolicitacaoValueY, retanguloWidth - 20, 7);

    currentY = descricaoSolicitacaoValueY + descricaoSolicitacaoLines.length * 7 + 5;

   // Calcula o espaço necessário para renderizar o campo "Diagnóstico"
   const diagnosticoText = "Diagnóstico";
   const diagnosticoTextWidth = doc.getStringUnitWidth(diagnosticoText) * 20 / doc.internal.scaleFactor;
   const espacoNecessarioDiagnostico = Math.max(30, 15 + (doc.splitTextToSize(diagnostico, retanguloWidth - 20).length * 7));

  // Verifica se há espaço suficiente para renderizar o campo "Diagnóstico" na página atual
  if (currentY + espacoNecessarioDiagnostico > pageHeight) {
    doc.addPage(); // Adicione uma nova página
    currentY = 0; // Defina a coordenada Y inicial para a nova página
  }

   // Renderiza o campo "Diagnóstico"
   const diagnosticoTextX = retanguloX + (retanguloWidth - diagnosticoTextWidth) / 2;
   const diagnosticoTextY = currentY; // Ajuste a coordenada Y para cima
   drawGrayRectangleWithText(doc, retanguloX, diagnosticoTextY, retanguloWidth, diagnosticoText);

   // Posicione o texto do diagnóstico abaixo do retângulo cinza
   const diagnosticoValueX = retanguloX + 10; // Ajuste a posição horizontal
   const diagnosticoValueY = diagnosticoTextY + 15; // Ajuste vertical
   doc.setFontSize(12);
   doc.setTextColor(0, 0, 0); // Cor do texto preto

   // Divide o conteúdo do diagnóstico em linhas para caber no espaço disponível
   const diagnosticoLines = doc.splitTextToSize(diagnostico, retanguloWidth - 20); // 20 é um ajuste para a margem

   // Verifica se há espaço suficiente para renderizar o texto do diagnóstico
   if (diagnosticoValueY + diagnosticoLines.length * 7 > pageHeight) {
     doc.addPage(); // Adicione uma nova página
     currentY = -10; // Defina a coordenada Y inicial para a nova página
     diagnosticoValueY = currentY + 20; // Ajuste vertical
   }


   addTextWithPageBreaks(doc, diagnosticoLines.join(' '), diagnosticoValueX, diagnosticoValueY, retanguloWidth - 40, 7);


  // Atualize a coordenada Y para a próxima seção
  currentY = diagnosticoValueY + diagnosticoLines.length * 7 + 5;

  // Calcula o espaço necessário para renderizar o campo "Serviço Realizado"
  const espacoNecessarioServico = Math.max(30, 15 + (doc.splitTextToSize(servicoRealizado, retanguloWidth - 20).length * 7));

  // Verifica se há espaço suficiente para renderizar o campo "Serviço Realizado" na página atual
  if (currentY + espacoNecessarioServico > pageHeight) {
    doc.addPage(); // Adicione uma nova página
    currentY = -10; // Defina a coordenada Y inicial para a nova página
  }

   const servicoText = "Serviço"; // Substitua pela constante que você definiu
   const servicoTextWidth = doc.getStringUnitWidth(servicoText) * 20 / doc.internal.scaleFactor;
   const servicoRealizadoTextX = retanguloX + (retanguloWidth - servicoTextWidth) / 2;
   const servicoRealizadoTextY = currentY + 10; // Ajuste a coordenada Y para cima
   drawGrayRectangleWithText(doc, retanguloX, servicoRealizadoTextY, retanguloWidth, servicoText);


   // Posicione o texto do serviço abaixo do retângulo cinza
   const servicoRealizadoValueX = retanguloX + 10; // Ajuste a posição horizontal
   const servicoRealizadoValueY = servicoRealizadoTextY + 15; // Ajuste vertical
   doc.setFontSize(12);
   doc.setTextColor(0, 0, 0); // Cor do texto preto

   // Divide o conteúdo do serviço em linhas para caber no espaço disponível
   const servicoLines = doc.splitTextToSize(servicoRealizado, retanguloWidth - 20); // 20 é um ajuste para a margem
   addTextWithPageBreaks(doc, servicoLines.join(' '), servicoRealizadoValueX, servicoRealizadoValueY, retanguloWidth - 40, 7);


   // Atualize a coordenada Y para a próxima seção
   currentY = servicoRealizadoValueY + servicoLines.length * 7 + 20; // Ajuste conforme necessário

   if (pecasTrocadas.length > 0) {
    // Calcula a altura total da tabela de peças (incluindo o cabeçalho e linhas)
    const tabelaPecasHeight = (pecasTrocadas.length + 1) * 10; // +1 para considerar o cabeçalho
  
    // Verifica se há espaço suficiente para renderizar a tabela na página atual
    if (currentY + tabelaPecasHeight + 20 > pageHeight) {
      doc.addPage();
      currentY = 10; // Defina a coordenada Y inicial para a nova página
    }
  
    // Adicionar texto "Peças Trocadas" antes de listar as peças individualmente
    centerText('Peças Trocadas:', currentY);
    currentY += 10; // Aumentamos o espaçamento para melhorar a visualização das informações
  
    // Define os títulos das colunas da tabela de peças
    const tableHeaders = ['Peça', 'Qtd', 'Código', 'Descrição', 'Estoque Almoxarifado'];
  
    // Renderiza os cabeçalhos da tabela de peças
    renderPecaTableRow(doc, retanguloX + 10 - 5, currentY, tableHeaders);
    currentY += 10;
  
    // Adicionar as peças trocadas em várias linhas da tabela
    pecasTrocadas.forEach((peca, index) => {
      // Verifica se há espaço suficiente para renderizar a linha da tabela na página atual
      if (currentY + 10 > pageHeight) {
        doc.addPage();
        currentY = 10; // Defina a coordenada Y inicial para a nova página
  
        // Adicionar texto "Peças Trocadas" novamente, já que a tabela começou em uma nova página
        centerText('Peças Trocadas:', currentY);
        currentY += 10; // Aumentamos o espaçamento para melhorar a visualização das informações
      }
  
      // Transforma os dados da peça em uma matriz
      const rowData = [
        `Peça ${index + 1}`,
        peca.qtde,
        peca.codigo,
        peca.descricao,
        peca.estoqueAlmoxarifado
      ];
  
      // Renderiza a linha da tabela de peças
      renderPecaTableRow(doc, retanguloX + 10 - 5, currentY, rowData);
      currentY += 10; // Aumentamos o espaçamento entre as linhas da tabela de peças
    });
  
    currentY += 20; // Espaço após a tabela
  }
   
  // Função para obter o formato do arquivo a partir da URL da imagem
function getFileFormatFromUrl(url) {
  if (typeof url !== 'string' || url.trim() === '') {
    return 'jpeg'; // Formato padrão
  }

  const parts = url.split('.');
  const extension = parts[parts.length - 1].toLowerCase();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'jpeg';
    case 'png':
      return 'png';
    case 'gif':
      return 'gif';
    // Adicione outros formatos conforme necessário
    default:
      return 'jpeg'; // Formato padrão
  }
}

// Função para centralizar uma imagem horizontalmente
function centerImageHorizontally(imageWidth) {
  const pageWidth = doc.internal.pageSize.width;
  const margin = (pageWidth - imageWidth) / 2;
  return margin;
}


// Verificar a posição Y atual e criar nova página se necessário
function checkAndAddPageIfRequired(doc, currentY, spaceRequired) {
  if (currentY + spaceRequired > pageHeight) {
    doc.addPage();
    return spaceRequired; // Retorne a nova posição Y após a criação da página
  }
  return currentY;
}

//Função para adicionar imagens ao PDF com tratamento de página
function addImagesToPDF(doc, images, currentY, pageHeight, imgWidth, imgHeight) {
  images.forEach((imageInfo) => {
    const { tipo, image } = imageInfo;

    if (currentY + imgHeight > pageHeight) {
      doc.addPage();
      currentY = 10;
    }

    const formatoFoto = getFileFormatFromUrl(image);
    const centerX = centerImageHorizontally(imgWidth);

    try {
      doc.addImage(image, formatoFoto, centerX, currentY, imgWidth, imgHeight);
      currentY += imgHeight + 10;
    } catch (error) {
      console.error(`Erro ao adicionar imagem ${tipo}: ${error.message}`);
    }
  });

  return currentY;
}


const hasFotosAntes = fotoAntesPreview || fotosAdicionais.some(foto => foto.tipo === 'antes');
const hasFotosDepois = fotoDepoisPreview || fotosAdicionais.some(foto => foto.tipo === 'depois');



if (hasFotosAntes || hasFotosDepois) {
  if (hasFotosAntes) {
    currentY = checkAndAddPageIfRequired(doc, currentY, 20);
    centerText('Relatório Fotográfico Antes:', currentY);
    currentY += 10;
  
    // Renderize a imagem "Antes" principal, se existir
    if (fotoAntesPreview) {
      currentY = addImagesToPDF(doc, [{ tipo: 'antes', image: fotoAntesPreview }], currentY, pageHeight, imgWidth, imgHeight);
    }
  
    // Renderize as imagens "Antes" adicionais
    const fotosAntesAdicionais = fotosAdicionais.filter((foto) => foto.tipo === 'antes');
    currentY = addImagesToPDF(doc, fotosAntesAdicionais, currentY, pageHeight, imgWidth, imgHeight);
    currentY = checkAndAddPageIfRequired(doc, currentY, 10); // 20 é um exemplo, ajuste conforme necessário
  }
  
  // Verifique se há fotos "Depois" para renderizar
  if (hasFotosDepois) {
    currentY = checkAndAddPageIfRequired(doc, currentY, 20);
    centerText('Relatório Fotográfico Depois:', currentY);
    currentY += 10;
  
    // Renderize a imagem "Depois" principal, se existir
    if (fotoDepoisPreview) {
      currentY = addImagesToPDF(doc, [{ tipo: 'depois', image: fotoDepoisPreview }], currentY, pageHeight, imgWidth, imgHeight);
    }
  
    // Renderize as imagens "Depois" adicionais
    const fotosDepoisAdicionais = fotosAdicionais.filter((foto) => foto.tipo === 'depois');
    currentY = addImagesToPDF(doc, fotosDepoisAdicionais, currentY, pageHeight, imgWidth, imgHeight);
  }
}

   // Renderize o campo "Observações"
   if (observacoes.trim() !== "") {
    const observacoesText = "Observações";
    const observacoesTextWidth = doc.getStringUnitWidth(observacoesText) * 20 / doc.internal.scaleFactor;
    const observacoesTextX = retanguloX + (retanguloWidth - observacoesTextWidth) / 2;
    currentY = checkAndAddPageIfRequired(doc, currentY, 20);
    drawGrayRectangleWithText(doc, retanguloX, currentY, retanguloWidth, observacoesText);
    currentY += 10;

   // Posicione o texto das observações abaixo do retângulo cinza
    const observacoesValueX = retanguloX + 10; // Ajuste a posição horizontal
    const observacoesValueY = currentY + 6; // Ajuste vertical
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0); // Cor do texto preto

   // Divida o conteúdo das observações em linhas para caber no espaço disponível
   const observacoesLines = doc.splitTextToSize(observacoes, retanguloWidth - 20); // 20 é um ajuste para a margem
   addTextWithPageBreaks(doc, observacoesLines.join(' '), observacoesValueX, observacoesValueY, retanguloWidth - 40, 7);

   // Atualize a coordenada Y para a próxima seção após o campo de observações
   currentY = observacoesValueY + observacoesLines.length * 7 + 20; // Ajuste conforme necessário
  }

 
  // Salvar o PDF com o nome "detalhes_ordem_servico.pdf"
  doc.save('detalhes_ordem_servico.pdf');

 // Converte o PDF para uma string base64 usando Buffer
 const pdfBase64 = Buffer.from(doc.output('arraybuffer')).toString('base64');

 console.log('PDF gerado com sucesso:', pdfBase64);

 return pdfBase64;
} catch (error) {
 console.error('Erro ao gerar o PDF:', error);
 throw error;
}
};

const renderFotosAntes = () => {
  return (
    <div className="photo photo-antes">
      <h4>Fotos Antes:</h4>
      {fotoAntesPreview && (
        <div className="image-container">
          <img src={fotoAntesPreview} alt="Foto Antes" className="preview-image" />
          <button type="button" onClick={handleExcluirFotoAntes}>
            Excluir Arquivo
          </button>
        </div>
      )}
      <input
        type="file"
        accept="image/*"
        onChange={handleRelatorioFotograficoAntesChange}
      />
      <button
        type="button"
        onClick={() => handleAdicionarFotoAdicional('antes')}
      >
        Adicionar Foto Adicional Antes
      </button>
    </div>
  );
};

const renderFotosDepois = () => {
  return (
    <div className="photo">
      <h4>Fotos Depois:</h4>
      {fotoDepoisPreview && (
        <div className="image-container">
          <img src={fotoDepoisPreview} alt="Foto Depois" className="preview-image" />
          <button type="button" onClick={handleExcluirFotoDepois}>
            Excluir Arquivo
          </button>
        </div>
      )}
      <input
        type="file"
        accept="image/*"
        onChange={handleRelatorioFotograficoDepoisChange}
      />
      <button
        type="button"
        onClick={() => handleAdicionarFotoAdicional('depois')}
      >
        Adicionar Foto Adicional Depois
      </button>
    </div>
  );
};

const renderFotosAdicionais = () => {
  return (
    <div className="photo-container">
      {fotosAdicionais.map((foto, index) => (
        <div className="photo" key={index}>
          <h4>Foto Adicional {index + 1} ({foto.tipo}):</h4>
          <img src={foto.image} alt={`Foto Adicional ${index + 1}`} className="preview-image" />
          <button
            type="button"
            onClick={() => handleExcluirFotoAdicional(index)}
          >
            Excluir Arquivo
          </button>
        </div>
      ))}
    </div>
  );
};


    return (
      <div className="ordem-servico-detalhes-container">
        <form className="ordem-servico-detalhes-form-container" onSubmit={handleSubmit}>
          <h2>Número da Ordem: {numero_ordem}</h2>
           <p>Secretaria: {secretaria}</p>
           <p>Prioridade: {prioridade}</p>
           <p>Data da Requisição: {data_agendamento && formatarData(data_agendamento)}</p>
           <p>Horário da Requisição: {horario_agendamento}</p>
           <p>Responsável: {responsavel}</p>
           <p>Manutenção: {Array.isArray(manutencao) ? manutencao.join(', ') : ''}</p>
           <p>Serviço: {Array.isArray(servico) ? servico.join(', ') : ''}</p>
           <p>Descrição da Solicitação: {descricao_solicitacao}</p>
           <hr />
           {/* Campo para o diagnóstico */}
          <div className="form-field">
            <label>Diagnóstico:</label>
            <textarea
              value={diagnostico}
              onChange={(e) => setDiagnostico(e.target.value)}
              rows={6}
              required
            />
          </div>
          {/* Campo para o serviço realizado */}
          <div className="form-field">
            <label>Serviço Realizado:</label>
            <textarea
              value={servicoRealizado}
              onChange={(e) => setServicoRealizado(e.target.value)}
              rows={6}
              required
            />
          </div>
          <hr /> 
            {/* Tabela para Peças Trocadas */}
             <div>
               <div className="table-container">
               <h3>Peças Trocadas</h3>
               <table>
                <thead>
                 <tr>
                   <th>Qtde</th>
                   <th>Código</th>
                   <th>Descrição da Peça</th>
                   <th>Estoque Almoxarifado</th>
                 </tr>
               </thead>
               <tbody>
                 {pecasTrocadas.map((peca, index) => (
                    <tr key={index}>
                     <td>
                       <input
                         type="text"
                         value={peca.qtde}
                         onChange={(e) => handleQtdeChange(e, index)}
                      />
                     </td>
                     <td>
                       <input
                         type="text"
                         value={peca.codigo}
                         onChange={(e) => handleCodigoChange(e, index)}
                       />
                     </td>
                     <td>
                       <input
                         type="text"
                         value={peca.descricao}
                         onChange={(e) => handleDescricaoChange(e, index)}
                       />
                     </td>
                     <td>
                       <select
                         value={peca.estoqueAlmoxarifado}
                         onChange={(e) => handleEstoqueChange(e, index)}
                       >
                        <option value="Sim">Sim</option>
                        <option value="Não">Não</option>
                      </select>
                     </td>
                    </tr>
                   ))}
                   </tbody>
                 </table>
              </div>
            </div>
          <div className="buttons-container">
            <button type="button" onClick={handleAddPeca}>
               Adicionar Peça
             </button>
            <div className="spacer"></div> {/* Espaço entre os botões */}
            <button type="button" onClick={handleRemovePeca}>
               Excluir Peça
            </button>
          </div>
          <hr /> 
          <div className="row">
            <div className="col">
            <h3>Relatório Fotográfico:</h3>
              {renderFotosAntes()}
              {renderFotosDepois()}
              {renderFotosAdicionais()}
            </div>
          </div>
            <div>
             <hr /> 
               <div className="form-field">
               <label>Observações:</label>
               <textarea
                 className="custom-textarea" // Aplicamos a classe "custom-textarea" aqui
                 value={observacoes}
                 onChange={(e) => setObservacoes(e.target.value)}
                 rows={6}
               />
              </div>
             </div>
             <div className="buttons-container">
               <button type="submit">
                  Salvar
              </button>
              <div className="spacer"></div> {/* Espaço entre os botões */}
              <button type="submit" onClick={handleReturn}>
                  Voltar
              </button>
             </div>
          </form>
       </div>
     );
   };


export default OrdemServicoDetalhes;