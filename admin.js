const SUPABASE_URL = 'https://dmwbvydkogpnhmprezew.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtd2J2eWRrb2dwbmhtcHJlemV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5ODE4NDksImV4cCI6MjEwMjU1Nzg0OX0.bi15oVkl8n8veVCkKjryKtuPSzrPjKblJ9AMERymhFY';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SENHA_MESTRA = 'turm4215_2026'; // Define a senha de acesso ao Painel

let colegioAtivoId = 1;

document.addEventListener('DOMContentLoaded', async () => {
    if (sessionStorage.getItem('admin_logado') === 'true') {
        liberarAcesso();
    }
});

function autenticarAdmin() {
    const senha = document.getElementById('senhaInput').value;
    if (senha === SENHA_MESTRA) {
        sessionStorage.setItem('admin_logado', 'true');
        liberarAcesso();
    } else {
        alert("❌ Senha incorreta!");
    }
}

async function liberarAcesso() {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('painelAdmin').style.display = 'block';
    
    await carregarColegios();
    carregarEstatisticas();
    carregarEditorPerguntas();
}

function logoutAdmin() {
    sessionStorage.removeItem('admin_logado');
    location.reload();
}

// 1. CARREGA COLÉGIOS E LOGO
async function carregarColegios() {
    const { data: colegios } = await _supabase.from('colegios').select('*');
    if (!colegios || colegios.length === 0) return;

    const seletor = document.getElementById('seletorColegio');
    seletor.innerHTML = '';

    colegios.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.innerText = c.nome;
        seletor.appendChild(opt);
    });

    colegioAtivoId = colegios[0].id;
    atualizarHeaderColegio(colegios[0]);
}

function trocarColegioAtivo() {
    const seletor = document.getElementById('seletorColegio');
    colegioAtivoId = parseInt(seletor.value);
    
    _supabase.from('colegios').select('*').eq('id', colegioAtivoId).single().then(({ data }) => {
        if (data) atualizarHeaderColegio(data);
    });

    carregarEstatisticas();
    carregarEditorPerguntas();
}

function atualizarHeaderColegio(colegio) {
    document.getElementById('nomeColegioHeader').innerText = colegio.nome;
    if (colegio.logo_path) {
        document.getElementById('logoColegio').src = colegio.logo_path;
    }
}

// 2. GRÁFICOS
async function carregarEstatisticas() {
    const { data: respostas } = await _supabase
        .from('respostas_pesquisa')
        .select('*');

    document.getElementById('totalRespostas').innerText = respostas ? respostas.length : 0;

    const contagemMotivos = {};
    (respostas || []).forEach(r => {
        const motivo = r.motivo_frequente || 'Outro / Não informado';
        contagemMotivos[motivo] = (contagemMotivos[motivo] || 0) + 1;
    });

    renderizarRelatoriosAvancados(respostas);
    
    const ctx = document.getElementById('graficoMotivos').getContext('2d');
    
    if (window.meuGrafico) window.meuGrafico.destroy();

    window.meuGrafico = new Chart(ctx, {
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

// 3. EXIBE 100% DOS TEXTOS E USA 'campo_chave' COMO CHAVE PRIMÁRIA
async function carregarEditorPerguntas() {
    const container = document.getElementById('gerenciadorPerguntas');

    const { data: perguntas, error } = await _supabase
        .from('perguntas_formulario')
        .select('*')
        .order('ordem', { ascending: true });

    if (error) {
        container.innerHTML = '<p>Erro ao carregar estrutura do formulário.</p>';
        return;
    }

    container.innerHTML = '';

    perguntas.forEach(p => {
        const key = p.campo_chave;
        const card = document.createElement('div');
        card.className = 'item-pergunta-card';

        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <div>
                    <strong>Coluna SQL: <code>${key}</code></strong> 
                    <span class="badge-sql">${p.tipo_sql || 'VARCHAR'}(${p.tamanho_max || 100})</span>
                </div>
                <button onclick="deletarPergunta('${key}')" class="btn-danger" style="width:auto; padding:5px 10px; font-size:0.8rem;">🗑️ Excluir</button>
            </div>

            <label>Enunciado da Pergunta (100% Visível):</label>
            <textarea id="label_${key}" class="input-full-text" style="margin-bottom:10px;">${p.label_texto}</textarea>

            <div class="grid-sql-config">
                <div>
                    <label>Tipo de Dado Esperado (SQL):</label>
                    <select id="tipo_sql_${key}">
                        <option value="VARCHAR" ${p.tipo_sql === 'VARCHAR' ? 'selected' : ''}>VARCHAR</option>
                        <option value="INT" ${p.tipo_sql === 'INT' ? 'selected' : ''}>INT</option>
                        <option value="BOOLEAN" ${p.tipo_sql === 'BOOLEAN' ? 'selected' : ''}>BOOLEAN</option>
                        <option value="TEXT" ${p.tipo_sql === 'TEXT' ? 'selected' : ''}>TEXT</option>
                    </select>
                </div>
                <div>
                    <label>Tamanho Máx. (Caracteres):</label>
                    <input type="number" id="tamanho_max_${key}" value="${p.tamanho_max || 100}">
                </div>
                <div style="display:flex; align-items:flex-end;">
                    <button onclick="salvarEdicaoPergunta('${key}')" class="btn-primary" style="width:100%; padding:10px;">
                        💾 Salvar Alterações SQL
                    </button>
                </div>
            </div>

            <label>Todas as Opções Cadastradas (Separadas por vírgula):</label>
            <textarea id="opcoes_${key}" class="input-full-text">${p.opcoes || ''}</textarea>
        `;

        container.appendChild(card);
    });
}

// 4. EDITA USANDO 'campo_chave' (RESOLVE ERRO 400)
async function salvarEdicaoPergunta(campoChave) {
    const novoLabel = document.getElementById(`label_${campoChave}`).value;
    const novoTipoSql = document.getElementById(`tipo_sql_${campoChave}`).value;
    const novoTamanhoMax = parseInt(document.getElementById(`tamanho_max_${campoChave}`).value);
    const novasOpcoes = document.getElementById(`opcoes_${campoChave}`).value;

    const { error } = await _supabase
        .from('perguntas_formulario')
        .update({ 
            label_texto: novoLabel, 
            tipo_sql: novoTipoSql,
            tamanho_max: novoTamanhoMax,
            opcoes: novasOpcoes 
        })
        .eq('campo_chave', campoChave);

    if (error) {
        console.error("Erro ao salvar:", error);
        alert("❌ Erro ao atualizar atributos da pergunta.");
    } else {
        alert("✅ Atributos SQL atualizados com sucesso!");
        carregarEditorPerguntas();
    }
}

// 5. APAGA USANDO 'campo_chave'
async function deletarPergunta(campoChave) {
    if (!confirm(`Deseja apagar a pergunta '${campoChave}' da base de dados?`)) return;

    const { error } = await _supabase
        .from('perguntas_formulario')
        .delete()
        .eq('campo_chave', campoChave);

    if (error) {
        alert("❌ Erro ao apagar pergunta.");
    } else {
        alert("🗑️ Pergunta removida!");
        carregarEditorPerguntas();
    }
}

// 6. CRIA NOVA PERGUNTA
async function inserirPergunta() {
    const texto = document.getElementById('novoTexto').value;
    const campoChave = document.getElementById('novoCampoChave').value;
    const tipoSql = document.getElementById('novoTipoSql').value;
    const tamanhoMax = parseInt(document.getElementById('novoTamanhoMax').value);
    const opcoes = document.getElementById('novasOpcoesInput').value;

    if (!texto || !campoChave) {
        alert("⚠️ Preencha o enunciado e o nome do campo coluna SQL.");
        return;
    }

    const novaPergunta = {
        label_texto: texto,
        campo_chave: campoChave,
        tipo_dado: tipoSql === 'INT' ? 'number' : 'select',
        tipo_sql: tipoSql,
        tamanho_max: tamanhoMax,
        opcoes: opcoes,
        colegio_id: colegioAtivoId
    };

    const { error } = await _supabase.from('perguntas_formulario').insert([novaPergunta]);

    if (error) {
        alert("❌ Erro ao inserir pergunta no Schema.");
    } else {
        alert("✅ Nova pergunta adicionada!");
        document.getElementById('novoTexto').value = '';
        document.getElementById('novoCampoChave').value = '';
        document.getElementById('novasOpcoesInput').value = '';
        carregarEditorPerguntas();
    }
}