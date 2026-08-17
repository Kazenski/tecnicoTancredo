// Configuração do Supabase vindo da CDN do HTML
const SUPABASE_URL = 'https://dmwbvydkogpnhmprezew.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtd2J2eWRrb2dwbmhtcHJlemV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5ODE4NDksImV4cCI6MjEwMjU1Nzg0OX0.bi15oVkl8n8veVCkKjryKtuPSzrPjKblJ9AMERymhFY';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 1. RENDERIZA AS PERGUNTAS DINAMICAMENTE
document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('containerPerguntas');
    
    // Busca do banco a lista de perguntas ordenada
    const { data: perguntas, error } = await _supabase
        .from('perguntas_formulario')
        .select('*')
        .order('ordem', { ascending: true });

    if (error) {
        container.innerHTML = '<p>Erro ao carregar o formulário.</p>';
        return;
    }

    container.innerHTML = ''; // Limpa mensagem de carregando

    perguntas.forEach(p => {
        const divGroup = document.createElement('div');
        divGroup.className = 'field-group';

        const label = document.createElement('label');
        label.innerText = p.label_texto;
        divGroup.appendChild(label);

        // Se for o campo idade (número)
        if (p.campo_chave === 'idade') {
            const input = document.createElement('input');
            input.type = 'number';
            input.id = p.campo_chave;
            input.name = p.campo_chave;
            input.min = '10';
            input.max = '25';
            input.required = true;
            divGroup.appendChild(input);
        } else {
            // Se for campo de escolha (Select)
            const select = document.createElement('select');
            select.id = p.campo_chave;
            select.name = p.campo_chave;
            select.required = true;

            const optDefault = document.createElement('option');
            optDefault.value = '';
            optDefault.innerText = 'Selecione...';
            select.appendChild(optDefault);

            // Transforma o texto separado por vírgula em opções HTML
            const listaOpcoes = p.opcoes ? p.opcoes.split(',').map(o => o.trim()) : [];
            
            listaOpcoes.forEach(opText => {
                const opt = document.createElement('option');
                // Mantém a compatibilidade com booleano nos campos de Sim/Não
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
});

// 2. SALVA A RESPOSTA NA BASE (EXATAMENTE COMO JÁ FUNCIONAVA)
document.getElementById('pesquisaForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const btn = document.getElementById('btnSalvar');
    btn.disabled = true;
    btn.innerText = "Enviando dados...";

    const dados = {
        serie: document.getElementById('serie').value,
        turno: document.getElementById('turno').value,
        idade: parseInt(document.getElementById('idade').value),
        genero: document.getElementById('genero').value,
        tempo_telas: document.getElementById('tempo_telas').value,
        presenciou_bullying: document.getElementById('presenciou_bullying').value,
        foi_vitima: document.getElementById('foi_vitima').value === 'true',
        ambiente_risco: document.getElementById('ambiente_risco').value,
        sabe_pedir_ajuda: document.getElementById('sabe_pedir_ajuda').value === 'true',
        motivo_frequente: document.getElementById('motivo_frequente').value
    };

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