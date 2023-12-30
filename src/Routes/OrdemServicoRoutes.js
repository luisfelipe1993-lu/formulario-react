const express = require('express');
const router = express.Router();
const db = require('../mySQL/db'); // Importe o arquivo de configuração da conexão


router.post('/ordens_servico', (req, res) => {
  const {
    numero_ordem,
    secretaria,
    prioridade,
    data_agendamento,
    horario_agendamento,
    responsavel,
    manutencao,
    servico,
    descricao_solicitacao,
    id_requisitante
  } = req.body;

 
  const manutencaoJSON = JSON.stringify(manutencao);
  const servicoJSON = JSON.stringify(servico);


  // Array de valores a serem inseridos na query
  const values = [
    numero_ordem,
    secretaria,
    prioridade,
    data_agendamento,
    horario_agendamento,
    responsavel,
    manutencaoJSON, // Use a variável JSON convertida
    servicoJSON,
    descricao_solicitacao,
    id_requisitante
  ];

  // Execute a query
  db.inserirDados(values, (err, result) => {
    if (err) {
      console.error('Erro ao salvar os dados no banco de dados:', err);
      res.status(500).json({ error: 'Erro ao salvar os dados no banco de dados' });
    } else {
      console.log('Dados salvos com sucesso!');
      res.status(200).json({ message: 'Dados salvos com sucesso!' });
    }
  });
});

module.exports = router;