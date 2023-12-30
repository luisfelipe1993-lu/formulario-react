const express = require('express');
const cors = require('cors');
const path = require ('path');
const mysql = require('mysql2');
const transporter = require('./components/nodeMailer');
const fs = require('fs');
const app = express(); // Mova a definição de 'app' para cima
const bodyParser = require('body-parser');
const multer = require('multer');
const { Client: FtpClient } = require("basic-ftp");

const baseDir = path.join(__dirname, 'build');  // Caminho até o diretório onde estão os arquivos no servidor

// Serve arquivos estáticos a partir do diretório 'system'
app.use(express.static(baseDir));

// Configuração para lidar com rotas e enviar o arquivo 'index.html'
app.get('/*', function (req, res) {
  res.sendFile(path.join(baseDir, 'index.html'));
});

// Configurar body-parser para aceitar payloads grandes
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.use(bodyParser.raw({ type: 'application/pdf' })); // Isso permite que você receba o PDF como um corpo de requisição binário

// Configuração do multer para lidar com uploads de arquivos
const storage = multer.memoryStorage(); // Armazena o arquivo em memória
const upload = multer({ storage: storage });



const pool = mysql.createPool({
  host: 'formulario_db.mysql.dbaas.com.br',
  user: 'formulario_db',
  password: 'Luis10@2023',
  database: 'formulario_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

app.use(cors());
app.use(express.json());

const apiRoutes = require('./Routes/api');
app.use('/api', apiRoutes);

// Rota raiz para verificar se o servidor está em execução
app.get('', (req, res) => {
  res.send('Servidor em execução');
});

// Função para gerar o número da ordem de serviço
const gerarNumeroOrdem = () => {
  const numeroAleatorio = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
  return String(numeroAleatorio).padStart(4, '0');
};

app.post('/upload-pdf', async (req, res) => {
  try {
    const client = new FtpClient();
    await client.access({
      host: 'ftp.www.oliveira.mg.gov.br',
      user: 'oliveira9',
      password: 'Infopmo2030750@',
    });
   
   await client.uploadFrom(req.body.pdf_data, '/public_html/pdfs_ordens_concluidas');

    console.log('PDF enviado com sucesso para o servidor FTP');

    await client.close();
    res.status(200).send('PDF enviado com sucesso');
  } catch (error) {
    console.error('Erro ao fazer upload do PDF para o servidor FTP:', error);

    // Adicione esta linha para fornecer detalhes específicos do erro
    console.error('Detalhes do erro:', error.message);

    res.status(500).send('Erro ao fazer upload do PDF');
  }
});

// Endpoint para cadastro de novo usuário
app.post('/api/cadastro', (req, res) => {
  const { username, password, email } = req.body;

  // Verificar se o nome de usuário já está em uso
  const query = 'SELECT * FROM login_requisitante WHERE username = ?';
  pool.query(query, [username], (error, result) => {
    if (error) {
      console.error('Erro ao verificar o nome de usuário:', error);
      res.status(500).json({ error: 'Erro ao verificar o nome de usuário' });
    } else {
      if (result.length > 0) {
        // Nome de usuário já está em uso
        res.status(409).json({ error: 'O nome de usuário já está em uso' });
      } else {
        // Nome de usuário disponível, fazer o cadastro
        const cadastroQuery = 'INSERT INTO login_requisitante (username, password,email) VALUES (?, ?, ?)';
        pool.query(cadastroQuery, [username, password, email], (cadastroError, cadastroResult) => {
          if (cadastroError) {
            console.error('Erro ao realizar o cadastro:', cadastroError);
            res.status(500).json({ error: 'Erro ao realizar o cadastro' });
          } else {
            console.log('Cadastro realizado com sucesso!');

           // Recupere o id_requisitante gerado no cadastro
            const id_requisitante = cadastroResult.insertId;
            console.log('ID do requisitante cadastrado:', id_requisitante);
            res.status(200).json({ message: 'Cadastro realizado com sucesso!', id_requisitante});
          }
        });
      }
    }
  });
});

// Rota de exemplo para consulta ao banco de dados
app.get('/consulta-banco', (req, res) => {
  // Consulta ao banco de dados
  const consulta = 'SELECT * FROM login_requisitante WHERE id_requisitante = 26';

  pool.query(consulta, (error, results) => {
    if (error) {
      console.error('Erro na consulta ao banco de dados:', error);
      res.status(500).send('Erro na consulta ao banco de dados');
    } else {
      // Retorna os resultados como JSON
      res.json(results);
    }
  });
});


// Endpoint para autenticação do usuário
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  const query = 'SELECT * FROM login_requisitante WHERE username = ? AND password = ?';
  pool.query(query, [username, password], (error, result) => {
    if (error) {
      console.error('Erro ao verificar as credenciais:', error);
      res.status(500).json({ error: 'Erro ao verificar as credenciais' });
    } else {
      if (result.length === 0) {
        // Credenciais inválidas
        res.status(401).json({ error: 'Credenciais inválidas' });
      } else {
        const user = result[0];

        // Verificar o status de aprovação
        if (user.status_aprovacao === 'aprovado') {
          // Credenciais válidas e usuário aprovado
          const userID = user.id_requisitante;
          res.status(200).json({ message: 'Autenticação bem-sucedida', userID });

          // Log para verificar o ID do usuário após a autenticação
          console.log('ID do usuário autenticado:', userID);
        } else if (user.status_aprovacao === 'pendente') {
          // Usuário não aprovado
          res.status(401).json({ error: 'Acesso negado. Aguarde aprovação.' });
        } else {
          // Outro status (pode adicionar lógica conforme necessário)
          res.status(401).json({ error: 'Acesso negado. Status desconhecido.' });
        }
      }
    }
  });
});


let numeroOrdem = null;

app.get('/api/gerar_numero_ordem', (req, res) => {
  numeroOrdem = gerarNumeroOrdem(); // Use a lógica existente ou implemente a sua própria
  res.json({ numero_ordem: numeroOrdem });
});

// Rota para aprovação de usuário por analista de sistemas
app.put('/api/aprovar-usuario/:id_requisitante', (req, res) => {
  const id_requisitante = req.params.id_requisitante;
  console.log('Aprovando usuário com ID:', id_requisitante);

  const query = 'UPDATE login_requisitante SET status_aprovacao = ? WHERE id_requisitante = ?';
  pool.query(query, ['aprovado', id_requisitante], (error, results) => {
    if (error) {
      console.error('Erro ao aprovar usuário:', error);
      res.status(500).json({ error: 'Erro ao aprovar usuário' });
    } else {
      console.log('Resultado da aprovação:', results);
      res.status(200).json({ message: 'Usuário aprovado com sucesso' });
    }
  });
});

// Rota para rejeição de usuário por analista de sistemas
app.put('/api/rejeitar-usuario/:id_requisitante', (req, res) => {
  const id_requisitante = req.params.id_requisitante;
  console.log('Rejeitando usuário com ID:', id_requisitante);

  const query = 'UPDATE login_requisitante SET status_aprovacao = ? WHERE id_requisitante = ?';
  pool.query(query, ['rejeitado', id_requisitante], (error, results) => {
    if (error) {
      console.error('Erro ao rejeitar usuário:', error);
      res.status(500).json({ error: 'Erro ao rejeitar usuário' });
    } else {
      console.log('Resultado da rejeição:', results);
      res.status(200).json({ message: 'Usuário rejeitado com sucesso' });
    }
  });
});



// Rota para aprovação de usuário por analista de sistemas
app.put('/api/aprovar-tecnico/:id', (req, res) => {
  const id = req.params.id;
  console.log('Aprovando tecnico com ID:', id);

  const query = 'UPDATE login_tecnico SET status_aprovacao = ? WHERE id = ?';
  pool.query(query, ['aprovado', id], (error, results) => {
    if (error) {
      console.error('Erro ao aprovar técnico:', error);
      res.status(500).json({ error: 'Erro ao aprovar técnico' });
    } else {
      console.log('Resultado da aprovação:', results);
      res.status(200).json({ message: 'Técnico aprovado com sucesso' });
    }
  });
});

// Rota para rejeição de usuário por analista de sistemas
app.put('/api/rejeitar-tecnico/:id', (req, res) => {
  const id = req.params.id;
  console.log('Rejeitando tecnico com ID:', id);

  const query = 'UPDATE login_tecnico SET status_aprovacao = ? WHERE id = ?';
  pool.query(query, ['rejeitado', id], (error, results) => {
    if (error) {
      console.error('Erro ao rejeitar técnico:', error);
      res.status(500).json({ error: 'Erro ao rejeitar técnico' });
    } else {
      console.log('Resultado da rejeição:', results);
      res.status(200).json({ message: 'Técnico rejeitado com sucesso' });
    }
  });
});



// Adicione esta rota para buscar usuários pendentes
app.get('/api/usuarios-pendentes', (req, res) => {
  const query = 'SELECT * FROM login_requisitante WHERE status_aprovacao = ?';
  
  // Altere 'pendente' para o status que você está usando para usuários pendentes
  pool.query(query, ['pendente'], (error, result) => {
    if (error) {
      console.error('Erro ao buscar usuários pendentes:', error);
      res.status(500).json({ error: 'Erro ao buscar usuários pendentes' });
    } else {
      res.status(200).json(result);
    }
  });
});

// Adicione esta rota para buscar técnicos pendentes
app.get('/api/tecnicos-pendentes', (req, res) => {
  const query = 'SELECT * FROM login_tecnico WHERE status_aprovacao = ?';
  
  // Altere 'pendente' para o status que você está usando para técnicos pendentes
  pool.query(query, ['pendente'], (error, result) => {
    if (error) {
      console.error('Erro ao buscar técnicos pendentes:', error);
      res.status(500).json({ error: 'Erro ao buscar técnicos pendentes' });
    } else {
      res.status(200).json(result);
    }
  });
});

app.post('/api/ordens_servico', async (req, res) => {
  const ordemServico = req.body;
  const checkboxesSelecionados = ordemServico.servico; // Supondo que você tem um campo "checkbox" no corpo da solicitação que contém os checkboxes selecionados
  
  // Defina o status como "Pendente" por padrão
   ordemServico.status = 'Pendente';


  console.log('Valores dos checkboxes recebidos:', checkboxesSelecionados);

  // Gerar o número da ordem de serviço automaticamente
  const numeroOrdem = gerarNumeroOrdem();
  ordemServico.numero_ordem = numeroOrdem;

  const destinatarios = [];

  // Determinar os destinatários com base nos checkboxes selecionados
  if (checkboxesSelecionados.includes('Informatica')) {
    destinatarios.push('informatica@oliveira.mg.gov.br');
    console.log('Adicionado destinatário de informatica');
  }

  if (checkboxesSelecionados.includes('Eletrico')) {
    destinatarios.push('eletrica@oliveira.mg.gov.br');
    console.log('Adicionado destinatário de elétrico');
  }

  if (checkboxesSelecionados.includes('Seguranca do Trabalho')) {
    destinatarios.push('Segdotrabalho@oliveira.mg.gov.br');
    console.log('Adicionado destinatário de segurança do trabalho');
  }

  if (checkboxesSelecionados.includes('Limpeza')) {
    destinatarios.push('limpeza@oliveira.mg.gov.br');
    console.log('Adicionado destinatário de limpeza');
  }

  // Recupere o e-mail do remetente da autenticação
  const emailRemetente = 'pmo@oliveira.mg.gov.br'; // Supondo que o e-mail do remetente esteja disponível na autenticação

  /*// Adicione o seu próprio endereço de e-mail para fins de teste
  destinatarios.push('luisfelipeims10@gmail.com');*/

  const query = 'INSERT INTO ordens_servico SET ?';
  pool.query(query, ordemServico, async (error, result) => {
    if (error) {
      console.error('Erro ao adicionar ordem de serviço:', error);
      res.status(500).json({ error: 'Erro ao adicionar ordem de serviço ao banco de dados' });
    } else {
      console.log('Ordem de serviço adicionada com sucesso!');

      // Agora você pode enviar e-mails para os destinatários determinados
      try {
        for (const destinatario of destinatarios) {
          const info = await transporter.sendMail({
            from: emailRemetente,
            to: destinatario,
            subject: 'Nova Ordem de Serviço Criada',
            text: 'Uma nova ordem de serviço foi criada. Verifique o painel de técnico para detalhes.',
          });

          console.log('E-mail enviado com sucesso para', destinatario, 'ID:', info.messageId);
        }

        res.status(200).json({ message: 'Ordem de serviço adicionada com sucesso!', numero_ordem: numeroOrdem });
      } catch (error) {
        console.error('Erro ao enviar e-mails:', error);
        res.status(500).json({ error: 'Erro ao enviar e-mails aos destinatários' });
      }
    }
  });
});



app.get('/api/ordens_servico', (req, res) => {
  const query = 'SELECT * FROM ordens_servico'; // Seleciona todas as informações das ordens de serviço

  pool.query(query, (error, result) => {
    if (error) {
      console.error('Erro ao buscar ordens de serviço:', error);
      res.status(500).json({ error: 'Erro ao buscar ordens de serviço' });
    } else {
      console.log('Ordens de serviço encontradas:', result);
      res.status(200).json(result);
    }
  });
});

app.get('/api/ordens_servico/:numero_ordem', (req, res) => {
  const numero_ordem = req.params.numero_ordem;
  const query = 'SELECT * FROM ordens_servico WHERE numero_ordem = ?';

  pool.query(query, [numero_ordem], (error, result) => {
    if (error) {
      console.error('Erro ao buscar detalhes da ordem de serviço:', error);
      res.status(500).json({ error: 'Erro ao buscar detalhes da ordem de serviço' });
    } else {
      if (result.length === 0) {
        console.log('Ordem de serviço não encontrada');
        res.status(404).json({ error: 'Ordem de serviço não encontrada' });
      } else {
        const ordemServicoDetalhes = result[0];
        res.status(200).json(ordemServicoDetalhes);
      }
    }
  });
});


app.post('/api/ordem_servico_detalhes', async (req, res) => {
  // Aqui você pode implementar a lógica para salvar os dados da ordem de serviço detalhes no banco de dados
  // Por exemplo, você pode obter os dados do formulário do corpo da solicitação
  const formData = req.body;

  formData.numero_ordem = parseInt(formData.numero_ordem, 10);

    const query = 'INSERT INTO ordem_servico_detalhes SET ?';
    pool.query(query, [formData], async (error, result) => {
      if (error) {
        console.error('Erro ao salvar os dados no banco de dados:', error);
        res.status(500).json({ error: 'Erro ao salvar os dados no banco de dados' });
      } else {
        console.log('Dados salvos com sucesso!');

        const numeroOrdem = formData.numero_ordem;
        console.log('Número da Ordem de Serviço:', numeroOrdem);

        // Recupere o e-mail do remetente da autenticação
        const emailRemetente = 'pmo@oliveira.mg.gov.br'; // Supondo que o e-mail do remetente esteja disponível na autenticação

        // Consulte a tabela ordens_servico para obter o id_requisitante
        const idRequisitanteQuery = 'SELECT id_requisitante FROM ordens_servico WHERE numero_ordem = ?';
        pool.query(idRequisitanteQuery, [numeroOrdem], async (idError, idResult) => {
          if (idError) {
            console.error('Erro ao consultar o id_requisitante:', idError);
          } else if (idResult.length > 0) {
            const idRequisitante = idResult[0].id_requisitante;
            console.log('ID do requisitante associado à ordem de serviço:', idRequisitante);

            // Consulte o banco de dados para obter o e-mail do usuário requisitante
            const emailQuery = 'SELECT email FROM login_requisitante WHERE id_requisitante = ?';
            pool.query(emailQuery, [idRequisitante], async (emailError, emailResult) => {
              if (emailError) {
                console.error('Erro ao consultar o e-mail do usuário requisitante:', emailError);
              } else if (emailResult.length > 0) {
                const emailRequisitante = emailResult[0].email;

                // Envie um e-mail para o usuário requisitante
                const assunto = 'Ordem de Serviço Detalhes Finalizada';
                const mensagem = `Ordem de serviço ${numeroOrdem} foi finalizada com sucesso!`;

                try {
                  const info = await transporter.sendMail({
                    from: emailRemetente, // Verifique se a variável emailRemetente está definida corretamente
                    to: emailRequisitante, // Use o e-mail do destinatário aqui
                    subject: assunto,
                    text: mensagem,
                  });

                  console.log('E-mail de notificação enviado com sucesso para o usuário requisitante.', info.messageId);
                } catch (emailSendError) {
                  console.error('Erro ao enviar o e-mail de notificação:', emailSendError);
                }
              } else {
                console.log('Usuário requisitante não encontrado.');
              }
            });
          } else {
            console.log('Ordem de serviço não encontrada.');
          }
        });

        res.status(200).json({ message: 'Dados salvos com sucesso!' });
      }
    });
  });



// Rota para receber os dados da ordem de serviço detalhes via GET
app.get('/api/ordem_servico_detalhes', (req, res) => {
  // Aqui você pode implementar a lógica para buscar os dados da ordem de serviço detalhes do banco de dados
  // Por exemplo, você pode obter o número da ordem de serviço do corpo da solicitação
  const numero_ordem = req.query.numero_ordem;
  
  const query = 'SELECT * FROM ordem_servico_detalhes WHERE numero_ordem = ?';
  pool.query(query, [numero_ordem], (error, result) => {
    if (error) {
      console.error('Erro ao obter os detalhes da Ordem de Serviço:', error);
      res.status(500).json({ error: 'Erro ao obter os detalhes da Ordem de Serviço' });
    } else {
      if (result.length === 0) {
        console.log('Ordem de Serviço não encontrada');
        res.status(404).json({ error: 'Ordem de Serviço não encontrada' });
      } else {
        const ordemServicoDetalhes = result[0];
        // Retorne os dados da ordem de serviço detalhes como resposta para a solicitação GET
        res.status(200).json(ordemServicoDetalhes);
      }
    }
  });
})

// Rota para consultar o email do usuário requisitante com base no id_requisitante
/*app.get('/api/email_requisitante/:idRequisitante', (req, res) => {
  const idRequisitante = req.params.idRequisitante;

  // Consulte o banco de dados para obter o email do usuário requisitante na tabela ordens_servico
  const emailQuery = 'SELECT lr.email FROM login_requisitante lr JOIN ordens_servico os ON lr.id_requisitante = os.id_requisitante WHERE os.id_requisitante = ?';

  pool.query(emailQuery, [idRequisitante], async (emailError, emailResult) => {
    if (emailError) {
      console.error('Erro ao consultar o email do usuário requisitante:', emailError);
      res.status(500).json({ error: 'Erro ao consultar o email do usuário requisitante' });
    } else if (emailResult.length > 0) {
      const emailRequisitante = emailResult[0].email;

      // Envie um e-mail para o usuário requisitante
      const assunto = 'Ordem de Serviço Detalhes Finalizada';
      const mensagem = 'Ordem de serviço foi finalizada com sucesso.';

      try {
        const sucesso = await transporter.sendMail(emailRequisitante, assunto, mensagem);

        if (sucesso) {
          console.log('E-mail de notificação enviado com sucesso para o usuário requisitante.');
          res.status(200).json({ message: 'Email enviado com sucesso para o usuário requisitante.' });
        } else {
          console.log('Erro ao enviar o e-mail de notificação para o usuário requisitante.');
          res.status(500).json({ error: 'Erro ao enviar o e-mail de notificação para o usuário requisitante' });
        }
      } catch (error) {
        console.error('Erro ao enviar o e-mail de notificação:', error);
        res.status(500).json({ error: 'Erro ao enviar o e-mail de notificação' });
      }
    } else {
      console.log('Usuário requisitante não encontrado.');
      res.status(404).json({ error: 'Usuário requisitante não encontrado' });
    }
  });
});*/

// Rota para login de técnicos
app.post('/api/login-tecnico', (req, res) => {
  const { username, password } = req.body;

  const query = 'SELECT * FROM login_tecnico WHERE username = ? AND password = ?';
  pool.query(query, [username, password], (error, result) => {
    if (error) {
      console.error('Erro ao verificar as credenciais do técnico:', error);
      res.status(500).json({ error: 'Erro ao verificar as credenciais do técnico' });
    } else {
      if (result.length === 0) {
        // Credenciais inválidas
        res.status(401).json({ error: 'Credenciais inválidas' });
      } else {
        const technician = result[0];

        // Verificar o status de aprovação
        if (technician.status_aprovacao === 'aprovado') {
          // Credenciais válidas e técnico aprovado
          const technicianID = technician.id;
          res.status(200).json({ message: 'Autenticação bem-sucedida', technicianID });

          // Log para verificar o ID do técnico após a autenticação
          console.log('ID do técnico autenticado:', technicianID);
        } else if (technician.status_aprovacao === 'pendente') {
          // Técnico não aprovado
          res.status(401).json({ error: 'Acesso negado. Aguarde aprovação.' });
        } else {
          // Outro status (pode adicionar lógica conforme necessário)
          res.status(401).json({ error: 'Acesso negado. Status desconhecido.' });
        }
      }
    }
  });
});

// Rota para atualizar o pdf_data no banco de dados
app.put('/api/ordens_servico/:numero_ordem', async (req, res) => {
  const numero_ordem = req.params.numero_ordem;
  const { pdf_data } = req.body;

  try {
    // Execute a consulta SQL para atualizar o pdf_data na tabela ordens_servico
    const [rows] = await pool.promise().query('UPDATE ordens_servico SET pdf_data = ? WHERE numero_ordem = ?', [pdf_data, numero_ordem]);

    // Verifique se a atualização foi bem-sucedida
    if (rows.affectedRows > 0) {
      res.send('PDF atualizado com sucesso!');
    } else {
      res.status(404).send('Ordem de serviço não encontrada.');
    }
  } catch (error) {
    console.error('Erro ao atualizar o PDF:', error);
    res.status(500).send('Erro ao atualizar o PDF.');
  }
});

// Endpoint para cadastro de novo usuário técnico
app.post('/api/cadastro-tecnico', (req, res) => {
  const { username, password } = req.body;

  // Verificar se o nome de usuário já está em uso
  const query = 'SELECT * FROM login_tecnico WHERE username = ?';
  pool.query(query, [username], (error, result) => {
    if (error) {
      console.error('Erro ao verificar o nome de usuário do técnico:', error);
      res.status(500).json({ error: 'Erro ao verificar o nome de usuário do técnico' });
    } else {
      if (result.length > 0) {
        // Nome de usuário já está em uso
        res.status(409).json({ error: 'O nome de usuário do técnico já está em uso' });
      } else {
        // Nome de usuário disponível, fazer o cadastro
        const cadastroQuery = 'INSERT INTO login_tecnico (username, password) VALUES (?, ?)';
        pool.query(cadastroQuery, [username, password], (cadastroError, cadastroResult) => {
          if (cadastroError) {
            console.error('Erro ao realizar o cadastro do técnico:', cadastroError);
            res.status(500).json({ error: 'Erro ao realizar o cadastro do técnico' });
          } else {
            console.log('Cadastro do técnico realizado com sucesso!');
            res.status(200).json({ message: 'Cadastro do técnico realizado com sucesso!' });
          }
        });
      }
    }
  });
});

// Endpoint para autenticação do técnico
app.post('/api/login-analista', (req, res) => {
  const { username, password } = req.body;

  console.log('Username:', username);
  console.log('Password:', password);

  const query = 'SELECT * FROM login_analista WHERE username = ? AND password = ?';
  pool.query(query, [username, password], (error, result) => {
    if (error) {
      console.error('Erro ao logar no sistema', error);
      res.status(500).json({ error: 'Erro ao logar no sistema' });
    } else {
      if (result.length === 0) {
        // Credenciais inválidas
        res.status(401).json({ error: 'Credenciais inválidas para o analista' });
      } else {
        // Credenciais válidas
        res.status(200).json({ message: 'Autenticação do analista bem-sucedida' });
      }
    }
  });
});



app.get('/sse', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Implemente a lógica para enviar atualizações de status
  const statusUpdates = [
    { status: 'Em andamento' },
    { status: 'Concluída' },
    { status: 'Pendente' },
  ];

  // Simule o envio periódico de atualizações de status a cada 2 segundos
  const interval = setInterval(() => {
    const randomUpdate = statusUpdates[Math.floor(Math.random() * statusUpdates.length)];
    res.write(`data: ${JSON.stringify(randomUpdate)}\n\n`);
  }, 2000);

  // Encerre a conexão quando o cliente desconectar
  res.on('close', () => {
    clearInterval(interval);
  });
});

app.get('/api/pdf/:numero_ordem', (req, res) => {
  const numeroOrdem = req.params.numero_ordem;

  // Recupere o PDF associado ao número da ordem do banco de dados.
  // O código real dependerá da sua estrutura de banco de dados e biblioteca de acesso a dados.

  // Exemplo usando o pacote 'mysql2':
  const query = 'SELECT pdf_data FROM ordem_servico_detalhes WHERE numero_ordem = ?';
  pool.query(query, [numeroOrdem], (error, results) => {
    if (error) {
      console.error('Erro ao buscar PDF do banco de dados:', error);
      res.status(500).send('Erro ao buscar PDF do banco de dados');
    } else if (results.length === 1) {
      const pdfData = results[0].pdf_data;

      // Defina os cabeçalhos de resposta apropriados
      res.setHeader('Content-Disposition', 'attachment; filename=ordem-de-servico.pdf');
      res.setHeader('Content-Type', 'application/pdf');

      console.log('PDF enviado com sucesso para o cliente:', pdfData);

      // Envie o arquivo PDF como um array de bytes
      res.send(pdfData);
    } else {
      // Caso a ordem de serviço não seja encontrada
      res.status(404).send('Ordem de serviço não encontrada');
    }
  });
});

app.get('/api/pdf_usuario_requisitante/:numero_ordem', (req, res) => {
  const numeroOrdem = req.params.numero_ordem;

  // Recupere o PDF associado ao número da ordem do banco de dados.
  // O código real dependerá da sua estrutura de banco de dados e biblioteca de acesso a dados.

  // Exemplo usando o pacote 'mysql2':
  const query = 'SELECT pdf_data FROM ordens_servico WHERE numero_ordem = ?';
  pool.query(query, [numeroOrdem], (error, results) => {
    if (error) {
      console.error('Erro ao buscar PDF do banco de dados:', error);
      res.status(500).send('Erro ao buscar PDF do banco de dados');
    } else if (results.length === 1) {
      const pdfData = results[0].pdf_data;

      // Defina os cabeçalhos de resposta apropriados
      res.setHeader('Content-Disposition', 'attachment; filename=ordem-de-servico.pdf');
      res.setHeader('Content-Type', 'application/pdf');

      console.log('PDF enviado com sucesso para o técnico:', pdfData);

      // Envie o arquivo PDF como um array de bytes
      res.send(pdfData);
    } else {
      // Caso a ordem de serviço não seja encontrada
      res.status(404).send('Ordem de serviço não encontrada');
    }
  });
});




app.get('/api/minhas-ordens/:id_requisitante', (req, res) => {
  const idRequisitante = req.params.id_requisitante;

  // Lógica para buscar as ordens de serviço associadas ao id_requisitante do usuário
  const query = 'SELECT * FROM ordens_servico WHERE id_requisitante = ?';

  pool.query(query, [idRequisitante], (error, results) => {
    if (error) {
      console.error('Erro ao buscar minhas ordens do banco de dados:', error);
      res.status(500).send('Erro ao buscar minhas ordens do banco de dados');
    } else {
      res.json(results);
    }
  });
});

app.put('/api/ordens_servico/andamento/:numero_ordem', (req, res) => {
  const numero_ordem = req.params.numero_ordem;
  const query = 'UPDATE ordens_servico SET status = ? WHERE numero_ordem = ?';
  pool.query(query, ['Em andamento', numero_ordem], (error, result) => {
    if (error) {
      console.error('Erro ao atualizar o status:', error);
      res.status(500).json({ error: 'Erro ao atualizar o status' });
    } else {
      res.json({ message: 'Ordem de serviço atualizada para "Em andamento" com sucesso!' });
    }
  });
});

app.put('/api/ordens_servico/pendente/:numero_ordem', (req, res) => {
  const numero_ordem = req.params.numero_ordem;
  const query = 'UPDATE ordens_servico SET status = ? WHERE numero_ordem = ?';
  pool.query(query, ['Pendente', numero_ordem], (error, result) => {
    if (error) {
      console.error('Erro ao atualizar o status:', error);
      res.status(500).json({ error: 'Erro ao atualizar o status' });
    } else {
      res.json({ message: 'Ordem de serviço atualizada para "Pendente" com sucesso!' });
    }
  });
});

app.put('/api/ordens_servico/concluir/:numero_ordem', (req, res) => {
  const numero_ordem = req.params.numero_ordem;

  // Execute uma instrução SQL para atualizar o status para 'Concluída' na tabela 'ordens_servico'
  const query = 'UPDATE ordens_servico SET status = ? WHERE numero_ordem = ?';
  pool.query(query, ['Concluída', numero_ordem], (error, result) => {
    if (error) {
      console.error('Erro ao atualizar o status:', error);
      res.status(500).json({ error: 'Erro ao atualizar o status' });
    } else {
      // Envie uma atualização de status para a rota SSE '/sse'
      const statusUpdate = { numero_ordem, status: 'Concluída' };
      res.write(`data: ${JSON.stringify(statusUpdate)}\n\n`);
      
      // Remova o bloco abaixo para evitar o erro de "Cannot set headers after they are sent to the client"
      // Agora, envie uma resposta JSON para o cliente
      // res.json({ message: 'Ordem de serviço concluída com sucesso!' });
    }
  });
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});