const express = require('express');
const { Pool } = require('pg'); // Biblioteca do PostgreSQL

const app = express();
app.use(express.json());
app.use(express.static('public')); // Servir os arquivos HTML/CSS

// Configuração do Banco de Dados (Dados do Supabase)
const pool = new Pool({
    connectionString: 'SUA_URL_DO_BANCO_DE_DADOS_AQUI' 
});

// Rota para RECEBER os dados do formulário
app.post('/api/salvar-resposta', async (req, res) => {
    try {
        const { serie, turno, idade, genero, tempo_telas, presenciou_bullying, foi_vitima, ambiente_risco, sabe_pedir_ajuda, motivo_frequente } = req.body;
        
        const query = `
            INSERT INTO respostas_pesquisa 
            (serie, turno, idade, genero, tempo_telas, presenciou_bullying, foi_vitima, ambiente_risco, sabe_pedir_ajuda, motivo_frequente) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `;
        
        await pool.query(query, [serie, turno, idade, genero, tempo_telas, presenciou_bullying, foi_vitima, ambiente_risco, sabe_pedir_ajuda, motivo_frequente]);
        
        res.status(201).json({ mensagem: "Dados salvos com sucesso!" });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: "Erro ao salvar no banco de dados." });
    }
});

// Rota para o Dashboard (Contagem por mês/ano)
app.get('/api/dashboard-stats', async (req, res) => {
    try {
        // Exemplo de SQL avançado que os alunos vão estudar!
        const query = `
            SELECT TO_CHAR(data_resposta, 'MM/YYYY') as mes_ano, COUNT(*) as total
            FROM respostas_pesquisa
            GROUP BY mes_ano
            ORDER BY mes_ano DESC;
        `;
        const resultado = await pool.query(query);
        res.json(resultado.rows);
    } catch (erro) {
        res.status(500).send("Erro ao buscar estatísticas");
    }
});

app.listen(3000, () => console.log('Servidor rodando na porta 3000'));