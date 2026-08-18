const SUPABASE_URL = 'https://dmwbvydkogpnhmprezew.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtd2J2eWRrb2dwbmhtcHJlemV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5ODE4NDksImV4cCI6MjEwMjU1Nzg0OX0.bi15oVkl8n8veVCkKjryKtuPSzrPjKblJ9AMERymhFY';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SENHA_MESTRA = 'turm4215_2026'; // Define a senha de acesso ao Painel

let colegioAtivoId = 1;

// Instâncias Globais do Chart.js
window.chartMotivos = null;
window.chartRosca = null;
window.chartDispersao = null;
window.chartDinamico = null;

document.addEventListener('DOMContentLoaded', async () => {
    if (sessionStorage.getItem('admin_logado') === 'true') {
        liberarAcesso();
    }
});

// 1. AUTENTICAÇÃO
window.autenticarAdmin = function() {
    const senhaInput = document.getElementById('senhaInput');
    const senha = senhaInput ? senhaInput.value : '';
    if (senha === SENHA_MESTRA) {
        sessionStorage.setItem('admin_logado', 'true');
        liberarAcesso();
    } else {
        alert("❌ Senha incorreta!");
    }
};

window.liberarAcesso = async function() {
    const loginModal = document.getElementById('loginModal');
    const painelAdmin = document.getElementById('painelAdmin');
    
    if (loginModal) loginModal.style.display = 'none';
    if (painelAdmin) painelAdmin.style.display = 'block';
    
    await carregarColegios();
    await carregarEstatisticas();
    await carregarEditorPerguntas();
};

window.logoutAdmin = function() {
    sessionStorage.removeItem('admin_logado');
    location.reload();
};

// 2. GERENCIAMENTO DE COLÉGIOS
window.carregarColegios = async function() {
    try {
        const { data: colegios, error } = await _supabase.from('colegios').select('*').order('nome');
        const seletor = document.getElementById('seletorColegio');
        if (!seletor) return;

        seletor.innerHTML = '';

        if (error || !colegios || colegios.length === 0) {
            seletor.innerHTML = '<option value="1">EEB Prof. Ângelo Cascaes Tancredo</option>';
            colegioAtivoId = 1;
            return;
        }

        colegios.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.innerText = c.nome;
            opt.dataset.logo = c.logo_path || 'img/logo.png';
            seletor.appendChild(opt);
        });

        colegioAtivoId = parseInt(colegios[0].id);
        seletor.value = colegioAtivoId;
        atualizarHeaderColegio(colegios[0]);
    } catch (err) {
        console.error("Erro ao carregar colégios:", err);
    }
};

window.cadastrarColegio = async function() {
    const inputNome = document.getElementById('novoNomeColegio');
    const inputLogo = document.getElementById('novoLogoColegio');

    const nome = inputNome ? inputNome.value.trim() : '';
    const logo_path = inputLogo ? inputLogo.value.trim() : 'img/logo.png';

    if (!nome) {
        alert("⚠️ Por favor, informe o nome do Colégio ou Setor.");
        return;
    }

    try {
        const { data, error } = await _supabase.from('colegios').insert([{ nome, logo_path }]).select();

        if (error) {
            console.error(error);
            alert("❌ Erro ao cadastrar colégio/setor.");
        } else {
            alert("✅ Instituição/Setor cadastrado com sucesso!");
            if (inputNome) inputNome.value = '';
            await carregarColegios();
            if (data && data.length > 0) {
                const seletor = document.getElementById('seletorColegio');
                if (seletor) {
                    seletor.value = data[0].id;
                    trocarColegioAtivo();
                }
            }
        }
    } catch (e) {
        console.error(e);
        alert("❌ Ocorreu um erro ao salvar.");
    }
};

window.trocarColegioAtivo = function() {
    const seletor = document.getElementById('seletorColegio');
    if (!seletor) return;

    colegioAtivoId = parseInt(seletor.value);
    const opcao = seletor.options[seletor.selectedIndex];
    
    if (opcao) {
        atualizarHeaderColegio({
            nome: opcao.innerText,
            logo_path: opcao.dataset.logo || 'img/logo.png'
        });
    }

    carregarEstatisticas();
    carregarEditorPerguntas();
};

function atualizarHeaderColegio(colegio) {
    const elNome = document.getElementById('nomeColegioHeader');
    const elLogo = document.getElementById('logoColegio');

    if (elNome) elNome.innerText = colegio.nome || 'Instituição Selecionada';
    if (elLogo) elLogo.src = colegio.logo_path || 'img/logo.png';
}

// 3. CARREGAR DADOS DAS PESQUISAS
window.carregarEstatisticas = async function() {
    try {
        const { data: respostas, error } = await _supabase
            .from('respostas_pesquisa')
            .select('*')
            .eq('colegio_id', colegioAtivoId);

        const elTotal = document.getElementById('totalRespostas');
        if (elTotal) elTotal.innerText = respostas ? respostas.length : 0;

        renderizarGraficoMotivos(respostas || []);
        await renderizarRelatoriosAvancados(respostas || []);
    } catch (e) {
        console.error("Erro em carregarEstatisticas:", e);
    }
};

function renderizarGraficoMotivos(respostas) {
    const canvas = document.getElementById('graficoMotivos');
    if (!canvas) return;

    const contagemMotivos = {};
    respostas.forEach(r => {
        const motivo = r.motivo_frequente || 'Outro / Não informado';
        contagemMotivos[motivo] = (contagemMotivos[motivo] || 0) + 1;
    });

    const labels = Object.keys(contagemMotivos);
    const valores = Object.values(contagemMotivos);

    if (window.chartMotivos) window.chartMotivos.destroy();

    window.chartMotivos = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: labels.length ? labels : ['Sem dados registrados'],
            datasets: [{
                label: 'Motivos Mais Frequentes',
                data: valores.length ? valores : [0],
                backgroundColor: '#3182ce',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
    });
}

// 4. BI & RELATÓRIOS AVANÇADOS
window.renderizarRelatoriosAvancados = async function(respostas) {
    // --- A) GRÁFICO DE ROSCA (Turnos) ---
    const canvasRosca = document.getElementById('graficoRoscaTurno');
    if (canvasRosca) {
        const contagemTurno = {};
        respostas.forEach(r => {
            const t = r.turno || 'Não informado';
            contagemTurno[t] = (contagemTurno[t] || 0) + 1;
        });

        if (window.chartRosca) window.chartRosca.destroy();

        window.chartRosca = new Chart(canvasRosca.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: Object.keys(contagemTurno).length ? Object.keys(contagemTurno) : ['Sem dados'],
                datasets: [{
                    data: Object.values(contagemTurno).length ? Object.values(contagemTurno) : [1],
                    backgroundColor: ['#3182ce', '#38a169', '#dd6b20', '#e53e3e', '#805ad5']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }

    // --- B) GRÁFICO DE IDADES DAS VÍTIMAS ---
    const canvasDispersao = document.getElementById('graficoDispersao');
    if (canvasDispersao) {
        const contagemIdade = {};
        respostas.filter(r => r.foi_vitima === true || r.foi_vitima === 'true').forEach(r => {
            if (r.idade) {
                contagemIdade[r.idade] = (contagemIdade[r.idade] || 0) + 1;
            }
        });

        const idadesOrdenadas = Object.keys(contagemIdade).sort((a,b) => parseInt(a) - parseInt(b));
        const qtdes = idadesOrdenadas.map(i => contagemIdade[i]);

        if (window.chartDispersao) window.chartDispersao.destroy();

        window.chartDispersao = new Chart(canvasDispersao.getContext('2d'), {
            type: 'bar',
            data: {
                labels: idadesOrdenadas.length ? idadesOrdenadas.map(i => `${i} anos`) : ['Sem vítimas'],
                datasets: [{
                    label: 'Nº de Vítimas por Idade',
                    data: qtdes.length ? qtdes : [0],
                    backgroundColor: '#e53e3e',
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
            }
        });
    }

    // --- C) POPULAR FILTRO DINÂMICO ---
    const seletorFiltro = document.getElementById('seletorFiltroDinamico');
    if (seletorFiltro) {
        try {
            const { data: perguntas } = await _supabase
                .from('perguntas_formulario')
                .select('*')
                .order('ordem', { ascending: true });

            seletorFiltro.innerHTML = '<option value="">-- Selecione uma pergunta para analisar --</option>';

            if (perguntas && perguntas.length > 0) {
                perguntas.forEach(p => {
                    const opt = document.createElement('option');
                    opt.value = p.campo_chave;
                    opt.innerText = p.label_texto;
                    seletorFiltro.appendChild(opt);
                });
            }
        } catch (err) {
            console.error("Erro ao carregar lista de filtro dinâmico:", err);
        }
    }
};

// 5. EXPLORADOR DINÂMICO
window.gerarGraficoDinamico = async function() {
    const seletor = document.getElementById('seletorFiltroDinamico');
    const canvas = document.getElementById('graficoDinamico');

    if (!seletor || !canvas) return;

    const campo = seletor.value;
    if (!campo) {
        alert("⚠️ Escolha uma pergunta no menu suspenso para gerar o gráfico.");
        return;
    }

    const textoPergunta = seletor.options[seletor.selectedIndex].text;

    try {
        const { data: respostas, error } = await _supabase
            .from('respostas_pesquisa')
            .select(campo)
            .eq('colegio_id', colegioAtivoId);

        if (error) {
            alert("❌ Erro ao consultar dados no Supabase.");
            return;
        }

        const contagem = {};
        (respostas || []).forEach(r => {
            let valor = r[campo];
            if (valor === true || valor === 'true') valor = 'Sim';
            else if (valor === false || valor === 'false') valor = 'Não';
            else if (valor === null || valor === undefined || valor === '') valor = 'Sem Resposta';

            contagem[valor] = (contagem[valor] || 0) + 1;
        });

        const labels = Object.keys(contagem);
        const valores = Object.values(contagem);

        if (window.chartDinamico) window.chartDinamico.destroy();

        window.chartDinamico = new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels.length ? labels : ['Sem dados'],
                datasets: [{
                    label: `Frequência de Respostas`,
                    data: valores.length ? valores : [0],
                    backgroundColor: '#805ad5',
                    borderRadius: 6
                }]
            },
            options: {
                indexAxis: 'y', // Barras horizontais
                responsive: true,
                maintainAspectRatio: false,
                scales: { x: { beginAtZero: true, ticks: { precision: 0 } } },
                plugins: {
                    title: { display: true, text: textoPergunta }
                }
            }
        });

    } catch (e) {
        console.error("Erro ao gerar gráfico dinâmico:", e);
    }
};

// 6. CRUD DE PERGUNTAS (ESQUEMA SQL)
window.carregarEditorPerguntas = async function() {
    const container = document.getElementById('gerenciadorPerguntas');
    if (!container) return;

    const { data: perguntas, error } = await _supabase
        .from('perguntas_formulario')
        .select('*')
        .order('ordem', { ascending: true });

    if (error) {
        container.innerHTML = '<p>Erro ao carregar estrutura do formulário.</p>';
        return;
    }

    container.innerHTML = '';

    (perguntas || []).forEach(p => {
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
};

window.inserirPergunta = async function() {
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
};

window.salvarEdicaoPergunta = async function(campoChave) {
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
        console.error(error);
        alert("❌ Erro ao atualizar pergunta.");
    } else {
        alert("✅ Atributos SQL atualizados!");
        carregarEditorPerguntas();
    }
};

window.deletarPergunta = async function(campoChave) {
    if (!confirm(`Deseja apagar a pergunta '${campoChave}'?`)) return;

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
};