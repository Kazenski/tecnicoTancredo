const SUPABASE_URL = 'https://dmwbvydkogpnhmprezew.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtd2J2eWRrb2dwbmhtcHJlemV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5ODE4NDksImV4cCI6MjEwMjU1Nzg0OX0.bi15oVkl8n8veVCkKjryKtuPSzrPjKblJ9AMERymhFY';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Busca todas as respostas da base
    const { data: respostas, error } = await _supabase
        .from('respostas_pesquisa')
        .select('*');

    if (error) {
        console.error("Erro ao buscar estatísticas:", error);
        return;
    }

    // 2. Contagem total de entrevistados
    document.getElementById('totalRespostas').innerText = respostas.length;

    // 3. Processa dados para o Gráfico de Motivos de Cyberbullying
    const contagemMotivos = {};
    respostas.forEach(r => {
        const motivo = r.motivo_frequente || 'Não informado';
        contagemMotivos[motivo] = (contagemMotivos[motivo] || 0) + 1;
    });

    const labels = Object.keys(contagemMotivos);
    const valores = Object.values(contagemMotivos);

    // 4. Renderiza o gráfico usando Chart.js
    const ctx = document.getElementById('graficoMotivos').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Motivos Mais Frequentes (Percepção dos Alunos)',
                data: valores,
                backgroundColor: '#3182ce'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true, ticks: { precision: 0 } }
            }
        }
    });
});