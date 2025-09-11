// Inicializar dados se não existirem
function inicializarDados() {
    if (!localStorage.getItem('estoque_chaves')) {
        const dadosIniciais = {
            chaves: [
                { 
                    codigo: "CH001", 
                    descricao: "Chave Tetra Segurança", 
                    estoque: 50,
                    vendas: []
                },
                { 
                    codigo: "CH002", 
                    descricao: "Chave Yale Residencial", 
                    estoque: 30,
                    vendas: []
                },
                { 
                    codigo: "CH003", 
                    descricao: "Chave Automotiva", 
                    estoque: 20,
                    vendas: []
                }
            ]
        };
        localStorage.setItem('estoque_chaves', JSON.stringify(dadosIniciais));
    }
}

// Obter dados do estoque
function obterDadosEstoque() {
    return JSON.parse(localStorage.getItem('estoque_chaves'));
}

// Salvar dados no localStorage
function salvarDados(dados) {
    localStorage.setItem('estoque_chaves', JSON.stringify(dados));
}

// Mostrar alerta
function mostrarAlerta(mensagem, tipo) {
    const alertElement = tipo === 'success' ? 
        document.getElementById('alertSuccess') : 
        document.getElementById('alertError');
        
    alertElement.textContent = mensagem;
    alertElement.style.display = 'block';
    
    setTimeout(() => {
        alertElement.style.display = 'none';
    }, 5000);
}