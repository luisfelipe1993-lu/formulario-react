const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'formulario_db.mysql.dbaas.com.br',
  user: 'formulario_db',
  password: 'Luis10@2023',
  database: 'formulario_db'

  
});

connection.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
  } else {
    console.log('Conexão bem-sucedida ao banco de dados!');
  }
});

// Funções para executar operações no banco de dados
// Por exemplo, uma função para inserir dados:
function inserirDados(dados, callback) {
  const query = 'INSERT INTO ordens_servico SET ?';
  connection.query(query, dados, callback);
}

// Função para autenticar o usuário
function login(username, password, callback) {
  const query = 'SELECT * FROM login_requisitante WHERE username = ? AND password = ?';
  connection.query(query, [username, password], callback);
}

/*function cadastrarUsuario(username, password, email, callback) {
  const query = 'INSERT INTO login_requisitante (username, password, email) VALUES (?, ?, ?)';
  connection.query(query, [username, password, email], (err, result) => {
    if (err) {
      console.error('Erro ao cadastrar usuário:', err);
      callback(err, null);
    } else {
      console.log('Usuário cadastrado com sucesso:', result);
      callback(null, result);
    }
  });
}*/


// Função para salvar as informações da OrdemServicoDetalhes
function inserirDadosOrdemServicoDetalhes(ordemServicoDetalhes, callback) {
  const {
    numero_ordem,
    diagnostico,
    servico_realizado,
    pecas_trocadas,
    relatorio_fotografico_antes,
    relatorio_fotografico_depois,
    observacoes,
  } = ordemServicoDetalhes;

  const query = `
    INSERT INTO ordem_servico_detalhes
    (numero_ordem, diagnostico, servico_realizado, pecas_trocadas, relatorio_fotografico_antes, relatorio_fotografico_depois, observacoes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    numero_ordem,
    diagnostico,
    servico_realizado,
    JSON.stringify(pecas_trocadas), // Convertendo para JSON antes de salvar no banco
    relatorio_fotografico_antes,
    relatorio_fotografico_depois,
    observacoes,
  ];

  connection.query(query, values, (err, result) => {
    if (err) {
      // Em caso de erro, chamamos o callback com o erro
      callback(err, null);
    } else {
      // Se a inserção foi bem-sucedida, chamamos o callback com o resultado
      callback(null, result);
    }
  });
}
 
// Exportar as funções e a conexão
module.exports = {
  connection,
  inserirDados,
  login,
  /*cadastrarUsuario,*/
  inserirDadosOrdemServicoDetalhes
  // Outras funções que você criar
};

