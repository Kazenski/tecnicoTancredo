// Função para buscar os dados e montar o gráfico assim que a página carregar
document.addEventListener("DOMContentLoaded", async () => {
    
    try {
        // Pede os dados para a nossa própria API (que busca no Supabase online)
        const resposta = await fetch('/api/dashboard-stats');
        const dadosDoBanco = await resposta.json();

        // O Chart.js precisa de duas listas separadas: uma de Rótulos (ex: Meses) e uma de Valores (ex: Quantidade)
        const rotulos = []; // Eixo X
        const valores = []; // Eixo Y

        // Separando os dados que vieram do banco
        dadosDoBanco.forEach(linha => {
            rotulos.push(linha.mes_ano);
            valores.push(linha.total);
        });

        // Desenhando o gráfico
        const contexto = document.getElementById('graficoRespostas').getContext('2d');
        
        new Chart(contexto, {
            type: 'bar', // Pode trocar para 'pie' (pizza) ou 'line' (linha) depois com os alunos!
            data: {
                labels: rotulos,
                datasets: [{
                    label: 'Número de Entrevistados por Mês',
                    data: valores,
                    backgroundColor: '#4A90E2', // Cor da barra
                    borderColor: '#003366',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1 // Força o eixo Y a contar de 1 em 1 (já que são pessoas)
                        }
                    }
                }
            }
        });

    } catch (erro) {
        console.error("Erro ao carregar o gráfico:", erro);
        alert("Não foi possível carregar os dados do painel.");
    }
});