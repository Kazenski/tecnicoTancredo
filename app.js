// Configuração do Supabase vindo da CDN do HTML
const SUPABASE_URL = 'https://dmwbvydkogpnhmprezew.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtd2J2eWRrb2dwbmhtcHJlemV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5ODE4NDksImV4cCI6MjEwMjU1Nzg0OX0.bi15oVkl8n8veVCkKjryKtuPSzrPjKblJ9AMERymhFY';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', async () => {
    await carregarDadosColegio();
    carregarPerguntas();
});

// Busca o Colégio no banco de dados e exibe o logo e nome no formulário
async function carregarDadosColegio() {
    try {
        const { data: colegio } = await _supabase
            .from('colegios')
            .select('*')
            .limit(1)
            .maybeSingle();

        if (colegio) {
            if (colegio.logo_path) {
                document.getElementById('logoColegioForm').src = colegio.logo_path;
            }
            if (colegio.nome) {
                document.getElementById('tituloColegioForm').innerText = `🔒 Pesquisa: ${colegio.nome}`;
            }
        }
    } catch (e) {
        console.log("Usando layout padrão de colégio");
    }
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

    if (dados.idade) dados.idade = parseInt(dados.idade);
    if (dados.foi_vitima) dados.foi_vitima = dados.foi_vitima === 'true';
    if (dados.sabe_pedir_ajuda) dados.sabe_pedir_ajuda = dados.sabe_pedir_ajuda === 'true';

    const { error } = await _supabase
        .from('respostas_pesquisa')
        .insert([dados]);

    if (error) {
        console.error("Erro ao salvar:", error);
        alert("❌ Ocorreu um erro ao salvar a resposta.");
    } else {
        alert("✅ Resposta anônima salva com sucesso!");
        this.reset();
    }

    btn.disabled = false;
    btn.innerText = "💾 Salvar Resposta Anônima";
});