// Configuração do Supabase vindo da CDN do HTML
const SUPABASE_URL = 'https://dmwbvydkogpnhmprezew.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtd2J2eWRrb2dwbmhtcHJlemV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5ODE4NDksImV4cCI6MjEwMjU1Nzg0OX0.bi15oVkl8n8veVCkKjryKtuPSzrPjKblJ9AMERymhFY';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.getElementById('pesquisaForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const btn = document.getElementById('btnSalvar');
    btn.disabled = true;
    btn.innerText = "Enviando dados...";

    // Captura os dados informados no formulário
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

    // Insere diretamente na tabela do Supabase
    const { data, error } = await _supabase
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