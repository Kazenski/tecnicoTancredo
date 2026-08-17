const SUPABASE_URL = 'https://dmwbvydkogpnhmprezew.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtd2J2eWRrb2dwbmhtcHJlemV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5ODE4NDksImV4cCI6MjEwMjU1Nzg0OX0.bi15oVkl8n8veVCkKjryKtuPSzrPjKblJ9AMERymhFY';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', async () => {
    carregarEstatisticas();
    carregarEditorPerguntas();
});

// 1. CARREGA OS GRÁFICOS
async function carregarEstatisticas() {
    const { data: respostas, error } = await _supabase
        .from('respostas_pesquisa')
        .select('*');

    if (error) return;

    document.getElementById('totalRespostas').innerText = respostas.length;

    const contagemMotivos = {};
    respostas.forEach(r => {
        const motivo = r.motivo_frequente || 'Não informado';
        contagemMotivos[motivo] = (contagemMotivos[motivo] || 0) + 1;
    });

    const ctx = document.getElementById('graficoMotivos').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(contagemMotivos),
            datasets: [{
                label: 'Motivos Mais Frequentes',
                data: Object.values(contagemMotivos),
                backgroundColor: '#3182ce'
            }]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
    });
}

// 2. CARREGA O EDITOR DE PERGUNTAS DENTRO DO ADMIN
async function carregarEditorPerguntas() {
    const container = document.getElementById('gerenciadorPerguntas');

    const { data: perguntas, error } = await _supabase
        .from('perguntas_formulario')
        .select('*')
        .order('ordem', { ascending: true });

    if (error) {
        container.innerHTML = '<p>Erro ao carregar editor.</p>';
        return;
    }

    container.innerHTML = '';

    perguntas.forEach(p => {
        const box = document.createElement('div');
        box.style.background = '#f7fafc';
        box.style.padding = '15px';
        box.style.marginBottom = '15px';
        box.style.borderRadius = '8px';
        box.style.border = '1px solid #e2e8f0';

        box.innerHTML = `
            <label><strong>Campo: ${p.campo_chave}</strong></label>
            <input type="text" id="label_${p.campo_chave}" value="${p.label_texto}" style="margin-bottom: 8px;">
            ${p.campo_chave !== 'idade' ? `
                <label style="font-size:0.8rem; color:#555;">Opções (separadas por vírgula):</label>
                <input type="text" id="opcoes_${p.campo_chave}" value="${p.opcoes || ''}">
            ` : ''}
            <button onclick="salvarPergunta('${p.campo_chave}')" style="margin-top: 10px; width: auto; padding: 8px 15px; font-size:0.85rem;">
                💾 Salvar Pergunta
            </button>
        `;

        container.appendChild(box);
    });
}

// 3. SALVA A EDIÇÃO DA PERGUNTA NO SUPABASE
async function salvarPergunta(campoChave) {
    const novoLabel = document.getElementById(`label_${campoChave}`).value;
    const inputOpcoes = document.getElementById(`opcoes_${campoChave}`);
    const novasOpcoes = inputOpcoes ? inputOpcoes.value : '';

    const { error } = await _supabase
        .from('perguntas_formulario')
        .update({ label_texto: novoLabel, opcoes: novasOpcoes })
        .eq('campo_chave', campoChave);

    if (error) {
        alert("❌ Erro ao atualizar pergunta.");
    } else {
        alert("✅ Pergunta atualizada com sucesso! Abra o formulário para conferir.");
    }
}