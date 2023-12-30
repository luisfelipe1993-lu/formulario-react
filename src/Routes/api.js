const express = require('express');
const router = express.Router();
const ordemServicoRoutes = require('./OrdemServicoRoutes');
const ordemServicoDetalhesRoutes = require('./OrdemServicoDetalhesRoutes');

router.use('/ordens_servico', ordemServicoRoutes);
router.use('/ordem_servico_detalhes', ordemServicoDetalhesRoutes);

module.exports = router;