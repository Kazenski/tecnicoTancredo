const SUPABASE_URL = 'https://dmwbvydkogpnhmprezew.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtd2J2eWRrb2dwbmhtcHJlemV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5ODE4NDksImV4cCI6MjEwMjU1Nzg0OX0.bi15oVkl8n8veVCkKjryKtuPSzrPjKblJ9AMERymhFY';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SENHA_MESTRA = 'turm4215_2026'; // Define a senha de acesso ao Painel

document.addEventListener('DOMContentLoaded', () => {
    // Verifica se já está logado na sessão
    if (sessionStorage.getItem('admin_logado') === 'true') {
        liberarAcesso();
    }
});

// 1. AUTENTICAÇÃO DO ADMIN
function autenticarAdmin() {
    const senha = document.getElementById('senhaInput').value;
    if (senha === SENHA_MESTRA) {
        sessionStorage.setItem('admin_logado', 'true');
        liberarAcesso();
    } else {
        alert("❌ Senha incorreta!");
    }
}

function liberarAcesso() {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('painelAdmin').style.display = 'block';
    carregarEstatisticas();
    carregarEditorPerguntas();
}

function logoutAdmin() {
    sessionStorage.removeItem('admin_logado');
    location.reload();
}

// 2. BUSCA E PLOTA OS GRÁFICOS
async function carregarEstatisticas() {
    const { data: respostas, error } = await _supabase
        .from('respostas_pesquisa')
        .select('*');

    if (error) return;

    document.getElementById('totalRespostas').innerText = respostas.length;

    const contagemMotivos = {};
    respostas.forEach(r => {
        const motivo = r.motivo_frequente || 'Outro / Não informado';
        contagemMotivos[motivo] = (contagemMotivos[motivo] || 0) + 1;
    });

    const ctx = document.getElementById('graficoMotivos').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(contagemMotivos),
            datasets: [{
                label: 'Motivos Mais Frequentes de Cyberbullying',
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

// 3. LISTA AS PERGUNTAS COM BOTÕES DE EDITAR E EXCLUIR (READ)
async function carregarEditorPerguntas() {
    const container = document.getElementById('gerenciadorPerguntas');

    const { data: perguntas, error } = await _supabase
        .from('perguntas_formulario')
        .select('*')
        .order('ordem', { ascending: true });

    if (error) {
        container.innerHTML = '<p>Erro ao carregar perguntas.</p>';
        return;
    }

    container.innerHTML = '';

    perguntas.forEach(p => {
        const box = document.createElement('div');
        box.className = 'item-pergunta-box';

        box.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <strong>Campo Chave: ${p.campo_chave} (ID: ${p.id})</strong>
                <button onclick="deletarPergunta(${p.id})" class="btn-danger" style="width:auto; padding:5px 10px; font-size:0.8rem;">🗑️ Excluir</button>
            </div>
            <label>Enunciado da Pergunta:</label>
            <input type="text" id="label_${p.id}" value="${p.label_texto}" style="margin-bottom: 8px;">
            
            <label>Opções (separadas por vírgula):</label>
            <input type="text" id="opcoes_${p.id}" value="${p.opcoes || ''}" style="margin-bottom: 8px;">
            
            <button onclick="salvarEdicaoPergunta(${p.id})" class="btn-primary" style="width: auto; padding: 6px 12px; font-size:0.85rem;">
                💾 Salvar Alterações
            </button>
        `;

        container.appendChild(box);
    });
}

// 4. INSERE UMA NOVA PERGUNTA (CREATE)
async function inserirPergunta() {
    const texto = document.getElementById('novoTexto').value;
    const campoChave = document.getElementById('novoCampoChave').value;
    const tipoDado = document.getElementById('novoTipoDado').value;
    const opcoes = document.getElementById('novasOpcoesInput').value;

    if (!texto || !campoChave) {
        alert("⚠️ Por favor, preencha o texto da pergunta e o campo chave.");
        return;
    }

    const novaPergunta = {
        label_texto: texto,
        campo_chave: campoChave,
        tipo_dado: tipoDado,
        opcoes: opcoes
    };

    const { error } = await _supabase
        .from('perguntas_formulario')
        .insert([novaPergunta]);

    if (error) {
        alert("❌ Erro ao inserir nova pergunta.");
    } else {
        alert("✅ Nova pergunta adicionada com sucesso!");
        document.getElementById('novoTexto').value = '';
        document.getElementById('novoCampoChave').value = '';
        document.getElementById('novasOpcoesInput').value = '';
        carregarEditorPerguntas();
    }
}

// 5. EDITA UMA PERGUNTA EXISTENTE (UPDATE)
async function salvarEdicaoPergunta(id) {
    const novoLabel = document.getElementById(`label_${id}`).value;
    const novasOpcoes = document.getElementById(`opcoes_${id}`).value;

    const { error } = await _supabase
        .from('perguntas_formulario')
        .update({ label_texto: novoLabel, opcoes: novasOpcoes })
        .eq('id', id);

    if (error) {
        alert("❌ Erro ao atualizar pergunta.");
    } else {
        alert("✅ Pergunta atualizada com sucesso!");
    }
}

// 6. APAGA UMA PERGUNTA (DELETE)
async function deletarPergunta(id) {
    if (!confirm("Tem certeza que deseja apagar esta pergunta do formulário?")) return;

    const { error } = await _supabase
        .from('perguntas_formulario')
        .delete()
        .eq('id', id);

    if (error) {
        alert("❌ Erro ao excluir pergunta.");
    } else {
        alert("🗑️ Pergunta removida!");
        carregarEditorPerguntas();
    }
}