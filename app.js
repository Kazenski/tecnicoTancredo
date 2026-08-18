// Configuração do Supabase vindo da CDN do HTML
const SUPABASE_URL = 'https://dmwbvydkogpnhmprezew.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtd2J2eWRrb2dwbmhtcHJlemV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5ODE4NDksImV4cCI6MjEwMjU1Nzg0OX0.bi15oVkl8n8veVCkKjryKtuPSzrPjKblJ9AMERymhFY';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', async () => {
    await carregarListaColegios();
    carregarPerguntas();
});

async function carregarListaColegios() {
    const seletor = document.getElementById('colegio_selecionado');
    const { data: colegios, error } = await _supabase.from('colegios').select('*').order('nome');

    seletor.innerHTML = '<option value="">-- Selecione sua escola/setor --</option>';
    
    if (colegios) {
        colegios.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.innerText = c.nome;
            opt.dataset.logo = c.logo_path || 'img/logo.png'; // Guarda a logo
            seletor.appendChild(opt);
        });
    }
// Muda a logo do cabeçalho quando o aluno escolhe a escola
    seletor.addEventListener('change', function() {
        if(this.value) {
            const opcaoSelecionada = this.options[this.selectedIndex];
            document.getElementById('logoColegioForm').src = opcaoSelecionada.dataset.logo;
            document.getElementById('tituloColegioForm').innerText = `🔒 Pesquisa: ${opcaoSelecionada.innerText}`;
        }
    });
}

// Renderiza as perguntas dinamicamente
async function carregarPerguntas() {
    const container = document.getElementById('containerPerguntas');
    
    const { data: perguntas, error } = await _supabase
        .from('perguntas_formulario')
        .select('*')
        .order('ordem', { ascending: true });

    if (error || !perguntas || perguntas.length === 0) {
        container.innerHTML = '<p>Nenhuma pergunta cadastrada no momento.</p>';
        return;
    }

    container.innerHTML = '';

    perguntas.forEach(p => {
        const divGroup = document.createElement('div');
        divGroup.className = 'field-group';

        const label = document.createElement('label');
        label.innerText = p.label_texto;
        divGroup.appendChild(label);

        if (p.tipo_sql === 'INT') {
            const input = document.createElement('input');
            input.type = 'number';
            input.id = p.campo_chave;
            input.name = p.campo_chave;
            input.required = true;
            divGroup.appendChild(input);
        } else if (p.tipo_sql === 'TEXT') {
            const input = document.createElement('input');
            input.type = 'text';
            input.id = p.campo_chave;
            input.name = p.campo_chave;
            if (p.tamanho_max) input.maxLength = p.tamanho_max;
            input.required = true;
            divGroup.appendChild(input);
        } else {
            const select = document.createElement('select');
            select.id = p.campo_chave;
            select.name = p.campo_chave;
            select.required = true;

            const optDefault = document.createElement('option');
            optDefault.value = '';
            optDefault.innerText = 'Selecione...';
            select.appendChild(optDefault);

            const listaOpcoes = p.opcoes ? p.opcoes.split(',').map(o => o.trim()) : [];
            
            listaOpcoes.forEach(opText => {
                const opt = document.createElement('option');
                if (p.campo_chave === 'foi_vitima' || p.campo_chave === 'sabe_pedir_ajuda') {
                    opt.value = opText.toLowerCase() === 'sim' ? 'true' : 'false';
                } else {
                    opt.value = opText;
                }
                opt.innerText = opText;
                select.appendChild(opt);
            });

            divGroup.appendChild(select);
        }

        container.appendChild(divGroup);
    });

    document.getElementById('btnSalvar').style.display = 'block';
}

// Salva a resposta
document.getElementById('pesquisaForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSalvar');
    btn.disabled = true;
    btn.innerText = "Enviando dados...";

    const formData = new FormData(this);
    const dados = Object.fromEntries(formData.entries());

    // Pega o ID e o Nome do colégio selecionado
    const seletorColegio = document.getElementById('colegio_selecionado');
    dados.colegio_id = parseInt(seletorColegio.value);
    dados.colegio_nome = seletorColegio.options[seletorColegio.selectedIndex].text;

    if (dados.idade) dados.idade = parseInt(dados.idade);
    if (dados.foi_vitima) dados.foi_vitima = dados.foi_vitima === 'true';
    if (dados.sabe_pedir_ajuda) dados.sabe_pedir_ajuda = dados.sabe_pedir_ajuda === 'true';

    const { error } = await _supabase.from('respostas_pesquisa').insert([dados]);

    if (error) alert("❌ Erro ao salvar a resposta.");
    else {
        alert("✅ Resposta salva com sucesso!");
        this.reset();
        document.getElementById('tituloColegioForm').innerText = "🔒 Pesquisa Anônima";
        document.getElementById('logoColegioForm').src = "img/logo.png";
    }
    btn.disabled = false;
    btn.innerText = "💾 Salvar Resposta Anônima";
});