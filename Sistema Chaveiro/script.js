// como os dados serão armazenados
const estruturaDados = {
  chaves: [
    {
      codigo: "CH001",
      descricao: "Chave Comum",
      estoque: 50,
      quadro: 10,
      precoCusto: 1.40,
      precoVenda: 1.80,
      precoCopia: 10.00,
      vendas: []
    }
  ],
  config: {
    precos: {
      copia: 10.00,
      perca: 0.00,
      venda: 1.80
    },
    tema: "escuro"
  }
};
function alterarTema() {
      document.body.classList.toggle('dark-mode');

      const temaAtual = document.body.classList.contains('dark-mode') ? 'escuro' : 'claro';
      localStorage.setItem('tema_chaveiro', temaAtual);
    }
    function aplicarTemaSalvo() {
      const temaSalvo = localStorage.getItem('tema_chaveiro');
      const btnTema = document.querySelector('.tema button');
      if (temaSalvo === 'escuro') {
        document.body.classList.add('dark-mode');
        if(btnTema) btnTema.textContent = '☀️';
      }
      else {
        document.body.classList.remove('dark-mode');  
        if(btnTema) btnTema.textContent = '🌙';
      }
    }


function registrarVenda() {
    const codigoChave = document.getElementById("codigoDaChave").value.trim();
    const quantidade = parseInt(document.getElementById("quantidade").value);
    const tipoVenda = document.getElementById("tipoVenda").value;
    const pagamento = document.getElementById("pagamento").value;

    // VALIDAÇÃO ADICIONADA: Verificar se o pagamento foi selecionado
    if(!codigoChave || isNaN(quantidade) || quantidade <= 0 || !pagamento) {
        alert("Por favor, preencha todos os campos corretamente.");
        return;
    }
    
    // Cache the parsed localStorage object to avoid repeated parsing
    let dadosCache = localStorage.getItem("estoque_chaves");
    let dados = dadosCache ? JSON.parse(dadosCache) : estruturaDados;
    
    // VALIDAÇÃO ADICIONADA: Verificar se dados e dados.config existem
    if (!dados || !dados.config) {
        alert("Erro ao carregar configurações. Recarregue a página.");
        return;
    }
    
    const chaveIndex = dados.chaves.findIndex(chave => chave.codigo === codigoChave);

    if(chaveIndex === -1) {
        alert("Chave não encontrada no estoque.");
        return;
    }

    const chave = dados.chaves[chaveIndex];
    
    if(chave.estoque < quantidade) {
        alert("Estoque insuficiente para esta venda.");
        return;
    }

    let valorVenda = 0;
    
    // VALIDAÇÃO ADICIONADA: Verificar se precoCopia existe antes de usar
    if(tipoVenda === "copia") {
        const precoCopia = chave.precoCopia || (dados.config && dados.config.precos ? dados.config.precos.copia : 10.00);
        valorVenda = quantidade * precoCopia;
    } else if(tipoVenda === "venda") {
        valorVenda = quantidade * chave.precoVenda;
    }
    
    // Atualizar estoque e quadro
    chave.estoque -= quantidade;
    chave.quadro = Math.max(0, chave.quadro - quantidade);
    
    // Registrar a venda
    chave.vendas.push({
        data: new Date().toLocaleString("pt-BR"),
        quantidade: quantidade,
        tipo: tipoVenda,
        valor: valorVenda,
        pagamento: pagamento // Agora garantido que tem valor
    });
    
    localStorage.setItem("estoque_chaves", JSON.stringify(dados));
    
    document.getElementById("codigoDaChave").value = "";
    document.getElementById("quantidade").value = "";
    
    alert(`Venda registrada com sucesso! Valor total: R$ ${valorVenda.toFixed(2)}`);
    
    if (typeof carregarHistorico === 'function') {
        carregarHistorico();
    }
}
function carregarHistorico() {
    let todasVendas = [];
    const dados = JSON.parse(localStorage.getItem("estoque_chaves")) || estruturaDados;
    const historicoDiv = document.getElementById("historicoVendas");
   
    if (!historicoDiv) return;
    
    historicoDiv.innerHTML = "";
    
    // VALIDAÇÃO ADICIONADA: Verificar se dados.chaves existe
    if (dados.chaves && Array.isArray(dados.chaves)) {
        dados.chaves.forEach(chave => {
            if (chave.vendas && Array.isArray(chave.vendas)) {
                chave.vendas.forEach(venda => {
                    // VALIDAÇÃO ADICIONADA: Garantir que todos os campos existem
                    todasVendas.push({
                        data: venda.data || "Data não registrada",
                        codigo: chave.codigo || "Código não informado",
                        quantidade: venda.quantidade || 0,
                        tipo: venda.tipo || "Tipo não informado",
                        pagamento: venda.pagamento || "Pagamento não informado",
                        valor: venda.valor || 0
                    });
                });
            }
        });
    }

    // Ordenar por data (mais recente primeiro)
    todasVendas.sort((a, b) => {
        try {
            return new Date(b.data) - new Date(a.data);
        } catch (e) {
            return 0;
        }
    });
    
    const ultimasVendas = todasVendas.slice(0, 10);

    if(ultimasVendas.length === 0) {
        historicoDiv.innerHTML = "<p>Nenhuma venda registrada ainda.</p>";
        return;
    }

    ultimasVendas.forEach(venda => {
        const vendaItem = document.createElement("div");
        vendaItem.className = "vendaItem";
        
        // CORREÇÃO: Formatar valor com segurança
        const valorFormatado = typeof venda.valor === 'number' ? venda.valor.toFixed(2) : "0.00";
        
        vendaItem.innerHTML = `
            <p><strong>Data:</strong> ${venda.data}</p>
            <p><strong>Chave:</strong> ${venda.codigo}</p>
            <p><strong>Quantidade:</strong> ${venda.quantidade}</p>
            <p><strong>Tipo:</strong> ${venda.tipo}</p>
            <p><strong>Pagamento:</strong> ${venda.pagamento}</p>
            <p><strong>Valor:</strong> R$ ${valorFormatado}</p>
            <hr>
        `;
        historicoDiv.appendChild(vendaItem);
    });
}

function carregarEstoque() {
    const dados = JSON.parse(localStorage.getItem("estoque_chaves")) || estruturaDados;
    const listaEstoque = document.getElementById("listaEstoque");
    
    if (!listaEstoque) return;
    
    listaEstoque.innerHTML = "";
    
    if (!dados.chaves || dados.chaves.length === 0) {
        listaEstoque.innerHTML = "<p>Nenhuma chave cadastrada no estoque.</p>";
        return;
    }
    
    dados.chaves.forEach(chave => {
        const item = document.createElement("div");
        item.className = "item-estoque";
        
        const alertaQuadro = (chave.quadro || 0) < 5 ? "alerta-baixo" : "";
        
        const precoCusto = typeof chave.precoCusto === 'number' ? chave.precoCusto.toFixed(2) : "0.00";
        const precoVenda = typeof chave.precoVenda === 'number' ? chave.precoVenda.toFixed(2) : "0.00";
        const precoCopia = typeof chave.precoCopia === 'number' ? chave.precoCopia.toFixed(2) : 
                          (dados.config && dados.config.precos && typeof dados.config.precos.copia === 'number' ? 
                          dados.config.precos.copia.toFixed(2) : "10.00");
        
        // HTML com botões de ação
        item.innerHTML = `
            <div class="chave-info">
                <p><strong>Código:</strong> ${chave.codigo || "N/A"}</p>
                <p><strong>Descrição:</strong> ${chave.descricao || "N/A"}</p>
                <p><strong>Estoque Total:</strong> ${chave.estoque || 0}</p>
                <p class="${alertaQuadro}"><strong>No Quadro:</strong> ${chave.quadro || 0}</p>
                <p><strong>Preço Custo:</strong> R$ ${precoCusto}</p>
                <p><strong>Preço Venda:</strong> R$ ${precoVenda}</p>
                <p><strong>Preço Cópia:</strong> R$ ${precoCopia}</p>
            </div>
            <div class="chave-actions">
                <button onclick="reabastecerChavePrompt('${chave.codigo}', 'estoque')">+ Estoque</button>
                <button onclick="reabastecerChavePrompt('${chave.codigo}', 'quadro')">+ Quadro</button>
                <button onclick="editarChave('${chave.codigo}')">Editar</button>
                <button class="btn-danger" onclick="excluirChave('${chave.codigo}')">Excluir</button>
            </div>
            <hr>
        `;
        listaEstoque.appendChild(item);
    });
}

// Função auxiliar para reabastecimento
function reabastecerChavePrompt(codigo, tipo) {
    const quantidade = parseInt(prompt(`Quantas unidades deseja adicionar ao ${tipo}?`));
    
    if (isNaN(quantidade) || quantidade <= 0) {
        alert("Quantidade inválida!");
        return;
    }
    
    reabastecerChave(codigo, tipo, quantidade);
}

function editarChave(codigo) {
  const dados = JSON.parse(localStorage.getItem("estoque_chaves")) || estruturaDados;
  const chaveIndex = dados.chaves.findIndex(chave => chave.codigo === codigo);
  if(chaveIndex === -1) {
    alert("Chave não encontrada.");
    return;
  }
   const chave = dados.chaves[chaveIndex];
    
    // Pedir novos valores ao usuário
    const novaDescricao = prompt("Nova descrição:", chave.descricao);
    const novoPrecoCusto = parseFloat(prompt("Novo preço de custo:", chave.precoCusto));
    const novoPrecoVenda = parseFloat(prompt("Novo preço de venda:", chave.precoVenda));
    const novoPrecoCopia = parseFloat(prompt("Novo preço para cópia:", chave.precoCopia));
    const novoEstoque = parseInt(prompt("Novo estoque total:", chave.estoque));
    const novoQuadro = parseInt(prompt("Nova quantidade no quadro:", chave.quadro));

  if (!novaDescricao || isNaN(novoPrecoCusto) || isNaN(novoPrecoVenda) || 
        isNaN(novoPrecoCopia) || isNaN(novoEstoque) || isNaN(novoQuadro) ||
        novoQuadro > novoEstoque) {
        alert("Valores inválidos! Operação cancelada.");
        return;  
    }
    dados.chaves[chaveIndex] = {
        ...chave,
        descricao: novaDescricao,
        precoCusto: novoPrecoCusto,
        precoVenda: novoPrecoVenda,
        precoCopia: novoPrecoCopia,
        estoque: novoEstoque,
        quadro: novoQuadro
    };
    
    localStorage.setItem("estoque_chaves", JSON.stringify(dados));
    alert("Chave atualizada com sucesso!");
    carregarEstoque();
}

function excluirChave(codigo) {
  if(!confirm(`Tem certeza que deseja excluir a chave ${codigo}? todas as vendas relacionadas serão perdidas.`)) {
    return;
  }
  const dados = JSON.parse(localStorage.getItem("estoque_chaves")) || estruturaDados;
  dados.chaves = dados.chaves.filter(chave => chave.codigo !== codigo);

  localStorage.setItem("estoque_chaves", JSON.stringify(dados));
  alert("Chave excluída com sucesso!");
  if (typeof carregarEstoque === 'function') {
    carregarEstoque();
  }
}
function reabastecerChave(codigo, tipo, quantidade) {
    const dados = JSON.parse(localStorage.getItem("estoque_chaves")) || estruturaDados;
    const chaveIndex = dados.chaves.findIndex(chave => chave.codigo === codigo);
    if(chaveIndex === -1) {
        alert("Chave não encontrada.");
        return false;
    }

    const chave = dados.chaves[chaveIndex];
    
    if(tipo === "estoque") {
        chave.estoque += quantidade;
        alert(`Estoque da chave ${codigo} reabastecido em ${quantidade}. Novo estoque: ${chave.estoque}`);
    }
    else if(tipo === "quadro") {
        if(chave.quadro + quantidade > chave.estoque) {
            alert("Não é possível reabastecer o quadro além do estoque total.");
            return false;
        }
        chave.quadro += quantidade;
        alert(`Quadro da chave ${codigo} reabastecido em ${quantidade}. Novo no quadro: ${chave.quadro}`);
    }
    localStorage.setItem("estoque_chaves", JSON.stringify(dados));

    if (typeof carregarEstoque === 'function') {
        carregarEstoque();
    }
    return true;
}
  function exportarDados() {
    const dados = JSON.parse(localStorage.getItem("estoque_chaves")) || estruturaDados;
    const dadosStr = JSON.stringify(dados, null, 2);
    const blob = new Blob([dadosStr], {type: "application/json"});
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `backup_estoque_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert("Dados exportados com sucesso!");
}

function importarDados(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const dadosImportados = JSON.parse(e.target.result);

      if (dadosImportados && dadosImportados.chaves && Array.isArray(dadosImportados.chaves)) {
        if(confirm("Dados válidos encontrados. Deseja restaurar o backup? Isso substituirá todos os dados atuais.")) {
          localStorage.setItem("estoque_chaves", JSON.stringify(dadosImportados));
          alert("Dados importados com sucesso!");
          location.reload();
        }
      } else {
        alert("Arquivo inválido. Nenhum dado foi importado.");
      } 
    } catch (error) {
            alert("Erro ao ler o arquivo: " + error.message);
        }
    };
    reader.readAsText(file);
}


function gerarRelatorio() {
    const dados = JSON.parse(localStorage.getItem("estoque_chaves")) || estruturaDados;
    const relatorioDiv = document.getElementById("relatorio");
    
    if(!relatorioDiv) return;
    
    let totalVendas = 0;
    let totalCustos = 0;

    // VALIDAÇÃO ADICIONADA: Verificar se dados.chaves existe
    if (dados.chaves && Array.isArray(dados.chaves)) {
        dados.chaves.forEach(chave => {
            if (chave.vendas && Array.isArray(chave.vendas)) {
                chave.vendas.forEach(venda => {
                    totalVendas += venda.valor || 0;
                    totalCustos += (venda.quantidade || 0) * (chave.precoCusto || 0);
                });
            }
        });
    }
    
    const lucro = totalVendas - totalCustos;
    
    // CORREÇÃO: Formatar valores com segurança
    relatorioDiv.innerHTML = `
        <p><strong>Total em Vendas:</strong> R$ ${typeof totalVendas === 'number' ? totalVendas.toFixed(2) : '0.00'}</p>
        <p><strong>Total de Custos:</strong> R$ ${typeof totalCustos === 'number' ? totalCustos.toFixed(2) : '0.00'}</p>
        <p><strong>Lucro Total:</strong> R$ ${typeof lucro === 'number' ? lucro.toFixed(2) : '0.00'}</p>
    `;
}

  function adicionarChave() {
    const precoCopia = parseFloat(document.getElementById('precoCopia').value);
    const codigo = document.getElementById('codigo').value.trim();
    const descricao = document.getElementById('descricao').value.trim();
    const precoCusto = parseFloat(document.getElementById('precoCusto').value);
    const precoVenda = parseFloat(document.getElementById('precoVenda').value);
    const estoqueInicial = parseInt(document.getElementById('quantidade').value);
    const quadro = parseInt(document.getElementById('quadro').value); // CORRIGIDO
    
    // Validar dados
    if (!codigo || !descricao) {
        alert('Por favor, preencha todos os campos.');
        return;
    }
    
    if (isNaN(precoCusto) || precoCusto < 0 || 
        isNaN(precoVenda) || precoVenda < 0 || 
        isNaN(estoqueInicial) || estoqueInicial < 0 ||
        isNaN(quadro) || quadro < 0 || quadro > estoqueInicial) { // VALIDAÇÃO ADICIONADA
        alert('Por favor, insira valores válidos. O quadro não pode ser maior que o estoque.');
        return;
    }
    
    // Carregar dados existentes
    const dados = JSON.parse(localStorage.getItem('estoque_chaves')) || estruturaDados;
    
    // Verificar se código já existe
    if (dados.chaves.some(chave => chave.codigo === codigo)) {
        alert('Já existe uma chave com este código.');
        return;
    }
    
    // Adicionar nova chave
    dados.chaves.push({
        codigo: codigo,
        descricao: descricao,
        estoque: estoqueInicial,
        quadro: quadro,
        precoCusto: precoCusto,
        precoVenda: precoVenda,
        precoCopia: precoCopia,
        vendas: []
    });
    
    // Salvar dados atualizados
    localStorage.setItem('estoque_chaves', JSON.stringify(dados));
    
    // Limpar formulário e mostrar mensagem de sucesso
    document.getElementById('formAdicionarChave').reset();
    alert(`Chave "${codigo}" adicionada com sucesso!`);
    
    // Redirecionar para a página de estoque após 1 segundo
    setTimeout(() => {
        window.location.href = 'estoque.html';
    }, 1000);
}
  
    
    function inicializar() {

      aplicarTemaSalvo();

      if(!localStorage.getItem("estoque_chaves")) {
        localStorage.setItem("estoque_chaves", JSON.stringify(estruturaDados));
      }
      if(document.getElementById("historicoVendas")) {
        carregarHistorico();
      }
      if(document.getElementById("listaEstoque")) {
        carregarEstoque();
      }

      if(document.getElementById('formAdicionarChave')) {
        document.getElementById("formAdicionarChave").addEventListener("submit", function(e) {
          e.preventDefault();
          adicionarChave();
        });
      }
    }

    // Função para debug - ver todos os dados
function debugEstoque() {
    const dados = JSON.parse(localStorage.getItem("estoque_chaves")) || estruturaDados;
    console.log("=== DEBUG DO ESTOQUE ===");
    console.log("Dados completos:", dados);
    console.log("Número de chaves:", dados.chaves.length);
    dados.chaves.forEach((chave, index) => {
        console.log(`Chave ${index + 1}:`, chave);
    });
    console.log("========================");
}

// Chame esta função no console para verificar os dados

    document.addEventListener("DOMContentLoaded", inicializar);



/* 
    pedido de cahve automatico
    grafico no relatorio
    relatorio aprimorado
    "extrato" igual do bb
    profissional (comissao)
    adicionar mais opcaoe de serviços
        

*/