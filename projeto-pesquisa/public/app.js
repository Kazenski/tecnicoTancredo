// public/app.js

document.getElementById('pesquisaForm').addEventListener('submit', async function(event) {
    // 1. Impede a página de recarregar quando clica em salvar
    event.preventDefault(); 

    // 2. Captura todos os dados do formulário "magicamente"
    // (Para isso funcionar, os <input> e <select> no HTML precisam ter o atributo 'name')
    const formData = new FormData(this);
    const dadosConvertidos = Object.fromEntries(formData.entries());

    try {
        // 3. Envia os dados para a nossa própria API no servidor Node.js
        const resposta = await fetch('/api/salvar-resposta', {
            method: 'POST', // Estamos ENVIANDO dados
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dadosConvertidos) // Transforma o objeto em texto JSON
        });

        // 4. Verifica se o servidor respondeu com sucesso
        if (resposta.ok) {
            alert("✅ Dados salvos com sucesso! Muito obrigado por contribuir para a pesquisa.");
            this.reset(); // Limpa o formulário para o próximo aluno preencher
        } else {
            alert("❌ Poxa, ocorreu um erro ao salvar na base de dados.");
        }

    } catch (erro) {
        console.error("Erro de comunicação:", erro);
        alert("❌ Erro de conexão com o servidor.");
    }
});