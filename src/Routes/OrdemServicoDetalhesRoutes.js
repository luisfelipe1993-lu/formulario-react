const express = require('express');
const router = express.Router();
const db = require('../mySQL/db');

router.post('/ordem_servico_detalhes', (req, res) => {
    const {
      numero_ordem,
      diagnostico,
      servico_realizado,
      pecas_trocadas,
      relatorio_fotografico_antes,
      relatorio_fotografico_depois,
      observacoes,
    } = req.body;

    
  
    // Array de valores a serem inseridos na query
    const values = [
      numero_ordem,
      diagnostico,
      servico_realizado,
      JSON.stringify(pecas_trocadas),
      relatorio_fotografico_antes,
      relatorio_fotografico_depois,
      observacoes,
    ];
  
    // Execute a query
    db.inserirDadosOrdemServicoDetalhes(values, (err, result) => {
      if (err) {
        console.error('Erro ao salvar os detalhes da Ordem de Serviço:', err);
        res.status(500).json({ error: 'Erro ao salvar os detalhes da Ordem de Serviço' });
      } else {
        console.log('Detalhes da Ordem de Serviço salvos com sucesso!');
        res.status(200).json({ message: 'Detalhes da Ordem de Serviço salvos com sucesso!' });
      }
    });
  });
  
  module.exports = router;