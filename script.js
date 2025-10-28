// Estrutura de dados principal
const estruturaDados = {
  chaves: [{
    codigo: "CH001",
    descricao: "Chave Comum",
    estoque: 50,
    quadro: 10,
    precoCusto: 1.40,
    precoVenda: 2.00,
    precoCopia: 10.00,
    vendas: []
  }],
  profissionais: [{
    id: 1,
    nome: "Edgar",
    comissao: 30,
    ativo: true
  }],
  servicos: [{
    codigo: "AFI001",
    descricao: "Afiação de Alicate",
    preco: 15.00,
    tipo: "servico",
    vendas: []
  }],
  config: {
    precos: {
      copia: 10.00,
      perca: 0.00,
      venda: 1.80
    },
    tema: "escuro"
  }
};

const BACKUP_CONFIG = {
  maxBackups: 4,
  backupKey: 'backups_estoque_chaveiro'
};

let sugestoesAtuais = [];

// Sistema de temas
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
    if (btnTema) btnTema.textContent = '☀️';
  } else {
    document.body.classList.remove('dark-mode');  
    if (btnTema) btnTema.textContent = '🌙';
  }
}

// Sistema de vendas
function registrarVenda() {
  const codigoItem = document.getElementById("codigoDaChave").value.trim();
  const quantidade = parseInt(document.getElementById("quantidade").value);
  const tipoVenda = document.getElementById("tipoVenda").value;
  const pagamento = document.getElementById("pagamento").value;

  if (!codigoItem || isNaN(quantidade) || quantidade <= 0 || !pagamento) {
    alert("Por favor, preencha todos os campos corretamente.");
    return;
  }
  
  let dados;
  try {
    dados = JSON.parse(localStorage.getItem("estoque_chaves")) || estruturaDados;
  } catch (e) {
    dados = estruturaDados;
  }
  
  if (!dados || !dados.config) {
    alert("Erro ao carregar configurações. Recarregue a página.");
    return;
  }

  // Buscar tanto em chaves quanto em serviços
  const chaveIndex = dados.chaves.findIndex(chave => 
    normalizarCodigo(chave.codigo) === normalizarCodigo(codigoItem)
  );

  const servicoIndex = dados.servicos ? dados.servicos.findIndex(servico => 
    normalizarCodigo(servico.codigo) === normalizarCodigo(codigoItem)
  ) : -1;

  if (chaveIndex === -1 && servicoIndex === -1) {
    alert("Item não encontrado.");
    return;
  }

  let valorVenda = 0;
  let item;
  let itemTipo = "";

  if (chaveIndex !== -1) {
    // É uma chave
    item = dados.chaves[chaveIndex];
    itemTipo = "chave";
    
    if (item.estoque < quantidade) {
      alert("Estoque insuficiente para esta venda.");
      return;
    }

    if (tipoVenda === "copia") {
      valorVenda = quantidade * item.precoCopia;
    } else if (tipoVenda === "venda") {
      valorVenda = quantidade * item.precoVenda;
    }
    
    // Atualizar estoque apenas para chaves
    item.estoque -= quantidade;
    item.quadro = Math.max(0, item.quadro - quantidade);
    
  } else {
    // É um serviço
    item = dados.servicos[servicoIndex];
    itemTipo = "servico";
    valorVenda = quantidade * item.preco;
    // Para serviços, o tipo de venda é sempre "servico"
    tipoVenda = "servico";
  }
  
  let valorComissao = 0;
  const profissionalId = document.getElementById("profissional")?.value;
  let profissional = undefined;
  
  if (profissionalId) {
    profissional = dados.profissionais.find(p => p.id == profissionalId);
    if (profissional) {
      valorComissao = (valorVenda * profissional.comissao) / 100;
    }
  }
  
  // Registrar a venda
  const venda = {
    data: new Date().toLocaleString("pt-BR"),
    quantidade: quantidade,
    tipo: tipoVenda,
    valor: valorVenda,
    pagamento: pagamento,
    profissionalId: profissionalId,
    comissao: valorComissao,
    timestamp: new Date().getTime(),
    itemTipo: itemTipo
  };

  if (chaveIndex !== -1) {
    dados.chaves[chaveIndex].vendas.push(venda);
  } else {
    dados.servicos[servicoIndex].vendas.push(venda);
  }

  localStorage.setItem("estoque_chaves", JSON.stringify(dados));
  
  document.getElementById("codigoDaChave").value = "";
  document.getElementById("quantidade").value = "";
  
  alert(`Venda registrada com sucesso! Valor total: R$ ${valorVenda.toFixed(2)}`);
  
  if (typeof carregarHistorico === 'function') {
    carregarHistorico();
  }
}

// Sistema de profissionais
function carregarProfissionaisNoSelect() {
  const select = document.getElementById('profissional');
  if (!select) return;
  
  const dados = JSON.parse(localStorage.getItem("estoque_chaves")) || estruturaDados;
  
  while (select.options.length > 1) {
    select.remove(1);
  }
  
  if (dados.profissionais && Array.isArray(dados.profissionais)) {
    dados.profissionais.filter(p => p.ativo).forEach(prof => {
      const option = document.createElement('option');
      option.value = prof.id;
      option.textContent = `${prof.nome} (${prof.comissao}%)`;
      select.appendChild(option);
    });
  }
}

function mostrarModalProfissionais() {
  const modalHTML = `
    <div class="modal" id="modalProfissionais">
      <div class="modal-content">
        <h3>Gerenciar Profissionais</h3>
        <div id="listaProfissionais"></div>
        <button onclick="adicionarProfissional()">Adicionar Profissional</button>
        <button onclick="fecharModal('modalProfissionais')">Fechar</button>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  carregarListaProfissionais();
}

function fecharModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
    modal.remove();
  }
}

function adicionarProfissional() {
  const nome = prompt("Nome do profissional:");
  if (!nome) return;
  
  const comissaoInput = prompt("Percentual de comissão:");
  if (comissaoInput === null) return;
  
  const comissao = parseFloat(comissaoInput);
  
  if (!nome || isNaN(comissao) || comissao < 0 || comissao > 100) {
    alert("Dados inválidos! Use valores entre 0 e 100 para a comissão.");
    return;
  }
  
  const dados = JSON.parse(localStorage.getItem("estoque_chaves")) || estruturaDados;
  
  if (!dados.profissionais || !Array.isArray(dados.profissionais)) {
    dados.profissionais = [];
  }
  
  const novoId = dados.profissionais.length > 0 
    ? Math.max(...dados.profissionais.map(p => p.id)) + 1 
    : 1;
  
  dados.profissionais.push({
    id: novoId,
    nome: nome,
    comissao: comissao,
    ativo: true
  });
  
  localStorage.setItem("estoque_chaves", JSON.stringify(dados));
  
  if (document.getElementById('listaProfissionais')) {
    carregarListaProfissionais();
  }
  
  alert("Profissional adicionado com sucesso!");
}

function carregarListaProfissionais() {
  const container = document.getElementById('listaProfissionais');
  if (!container) return;
  
  const dados = JSON.parse(localStorage.getItem("estoque_chaves")) || estruturaDados;
  
  if (!dados.profissionais || dados.profissionais.length === 0) {
    container.innerHTML = "<p>Nenhum profissional cadastrado.</p>";
    return;
  }
  
  container.innerHTML = dados.profissionais.map(prof => `
    <div class="profissional-item ${prof.ativo ? '' : 'inativo'}">
      <div class="profissional-info">
        <span class="profissional-nome">${prof.nome}</span>
        <span class="profissional-comissao">${prof.comissao}% de comissão</span>
        <span class="profissional-status">${prof.ativo ? '✅ Ativo' : '❌ Inativo'}</span>
      </div>
      <div class="profissional-actions">
        <button onclick="editarProfissional(${prof.id})">Editar</button>
        <button onclick="toggleAtivoProfissional(${prof.id}, ${!prof.ativo})">
          ${prof.ativo ? 'Desativar' : 'Ativar'}
        </button>
        <button class="btn-danger" onclick="removerProfissional(${prof.id})">Remover</button>
      </div>
    </div>
  `).join('');
}

function toggleAtivoProfissional(id, novoStatus) {
  const dados = JSON.parse(localStorage.getItem("estoque_chaves")) || estruturaDados;
  const profIndex = dados.profissionais.findIndex(p => p.id === id);
  
  if (profIndex === -1) {
    alert("Profissional não encontrado.");
    return;
  }
  
  dados.profissionais[profIndex].ativo = novoStatus;
  localStorage.setItem("estoque_chaves", JSON.stringify(dados));
  
  if (document.getElementById('listaProfissionais')) {
    carregarListaProfissionais();
  }
  carregarProfissionaisNoSelect();
  
  alert(`Profissional ${novoStatus ? 'ativado' : 'desativado'} com sucesso!`);
}

function editarProfissional(id) {
  const dados = JSON.parse(localStorage.getItem("estoque_chaves")) || estruturaDados;
  const profIndex = dados.profissionais.findIndex(p => p.id === id);
  
  if (profIndex === -1) {
    alert("Profissional não encontrado.");
    return;
  }
  
  const prof = dados.profissionais[profIndex];
  
  const novoNome = prompt("Novo nome:", prof.nome || "");
  if (novoNome === null) return;
  
  const novaComissaoInput = prompt("Novo percentual de comissão:", prof.comissao || 0);
  if (novaComissaoInput === null) return;
  
  const novaComissao = parseFloat(novaComissaoInput);
  
  if (!novoNome.trim()) {
    alert("O nome não pode estar vazio!");
    return;
  }
  
  if (isNaN(novaComissao) || novaComissao < 0 || novaComissao > 100) {
    alert("Comissão inválida! Use valores entre 0 e 100.");
    return;
  }
  
  dados.profissionais[profIndex] = {
    ...prof,
    nome: novoNome.trim(),
    comissao: novaComissao
  };
  
  localStorage.setItem("estoque_chaves", JSON.stringify(dados));
  
  if (document.getElementById('listaProfissionais')) {
    carregarListaProfissionais();
  }
  carregarProfissionaisNoSelect();
  
  alert("Profissional atualizado com sucesso!");
}

function removerProfissional(id) {
  if (!confirm("Tem certeza que deseja remover este profissional?\n\nEsta ação não exclui as vendas associadas, mas o profissional não estará mais disponível para novas vendas.")) {
    return;
  }
  
  const dados = JSON.parse(localStorage.getItem("estoque_chaves")) || estruturaDados;
  const profIndex = dados.profissionais.findIndex(p => p.id === id);
  
  if (profIndex === -1) {
    alert("Profissional não encontrado.");
    return;
  }
  
  let vendasAssociadas = 0;
  dados.chaves.forEach(chave => {
    if (chave.vendas) {
      vendasAssociadas += chave.vendas.filter(venda => venda.profissionalId == id).length;
    }
  });
  
  if (vendasAssociadas > 0) {
    if (!confirm(`Este profissional tem ${vendasAssociadas} venda(s) associada(s).\nDeseja marcar como inativo em vez de remover?`)) {
      dados.profissionais[profIndex].ativo = false;
      localStorage.setItem("estoque_chaves", JSON.stringify(dados));
      
      if (document.getElementById('listaProfissionais')) {
        carregarListaProfissionais();
      }
      carregarProfissionaisNoSelect();
      
      alert("Profissional marcado como inativo!");
      return;
    }
  }
  
  dados.profissionais.splice(profIndex, 1);
  localStorage.setItem("estoque_chaves", JSON.stringify(dados));
  
  if (document.getElementById('listaProfissionais')) {
    carregarListaProfissionais();
  }
  carregarProfissionaisNoSelect();
  
  alert("Profissional removido com sucesso!");
}

// Sistema de histórico e relatórios
function converterDataBrasileira(dataString) {
  if (!dataString) return null;
  
  try {
    const partes = dataString.split(' ')[0].split('/');
    
    if (partes.length === 3) {
      const dia = parseInt(partes[0]);
      const mes = parseInt(partes[1]) - 1;
      const ano = parseInt(partes[2]);
      
      if (isNaN(dia) || isNaN(mes) || isNaN(ano)) {
        console.error('Data inválida:', dataString);
        return null;
      }
      
      return new Date(ano, mes, dia);
    }
  } catch (e) {
    console.error('Erro ao converter data:', dataString, e);
  }
  
  return null;
}

function aplicarFiltroData() {
  const dataInicio = document.getElementById("dataInicio").value;
  const dataFim = document.getElementById("dataFim").value;

  console.log('🔍 Aplicando filtro:', { dataInicio, dataFim });
  
  if (!dataInicio || !dataFim) {
    alert("Por favor, selecione ambas as datas.");
    return;
  }

  if (new Date(dataInicio) > new Date(dataFim)) {
    alert("A data inicial não pode ser maior que a data final!");
    return;
  }

  carregarHistorico(dataInicio, dataFim);
  gerarRelatorio(dataInicio, dataFim);
  criarGraficos(dataInicio, dataFim);
}

function limparFiltrosData() {
  document.getElementById("dataInicio").value = "";
  document.getElementById("dataFim").value = "";
  carregarHistorico();
  gerarRelatorio();
  criarGraficos();
}

function carregarHistorico(dataInicio = null, dataFim = null) {
  const dados = JSON.parse(localStorage.getItem("estoque_chaves")) || estruturaDados;
  const historicoDiv = document.getElementById("historicoVendas");
  
  if (!historicoDiv) return;
  
  historicoDiv.innerHTML = "";

  let todasVendas = [];
  console.log('📋 Carregando histórico para período:', { dataInicio, dataFim });

  // Coletar vendas de chaves
  if (dados.chaves && Array.isArray(dados.chaves)) {
    dados.chaves.forEach(chave => {
      if (chave.vendas && Array.isArray(chave.vendas)) {
        chave.vendas.forEach(venda => {
          todasVendas.push({  
            data: venda.data || "Data não registrada",
            codigo: chave.codigo || "Código não informado",
            descricao: chave.descricao || "Descrição não informada",
            quantidade: venda.quantidade || 0,
            tipo: venda.tipo || "Tipo não informado",
            pagamento: venda.pagamento || "Pagamento não informado",
            valor: venda.valor || 0,
            timestamp: venda.timestamp || new Date(venda.data).getTime() || Date.now(),
            categoria: "chave"
          });
        });
      }
    });
  }

  // Coletar vendas de serviços
  if (dados.servicos && Array.isArray(dados.servicos)) {
    dados.servicos.forEach(servico => {
      if (servico.vendas && Array.isArray(servico.vendas)) {
        servico.vendas.forEach(venda => {
          todasVendas.push({  
            data: venda.data || "Data não registrada",
            codigo: servico.codigo || "Código não informado",
            descricao: servico.descricao || "Descrição não informada",
            quantidade: venda.quantidade || 0,
            tipo: "servico",
            pagamento: venda.pagamento || "Pagamento não informado",
            valor: venda.valor || 0,
            timestamp: venda.timestamp || new Date(venda.data).getTime() || Date.now(),
            categoria: "servico"
          });
        });
      }
    });
  }

  if (dataInicio && dataFim) {
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    fim.setHours(23, 59, 59, 999);

    todasVendas = todasVendas.filter(venda => {
      try {
        const dataVenda = converterDataBrasileira(venda.data);
        if (!dataVenda) return false;
        return dataVenda >= inicio && dataVenda <= fim;
      } catch (e) {
        console.error("Erro ao processar data:", venda.data, e);
        return false;
      }
    });
  }

  // CORREÇÃO: Ordenar por timestamp (mais recente primeiro)
  todasVendas.sort((a, b) => {
    return b.timestamp - a.timestamp;
  });

  let vendasParaExibir;
  if (dataInicio && dataFim) {
    vendasParaExibir = todasVendas;
  } else {
    vendasParaExibir = todasVendas.slice(0, 10);
  }

  if (vendasParaExibir.length === 0) {
    if (dataInicio && dataFim) {
      historicoDiv.innerHTML = `<p>Nenhuma venda encontrada no período de 
        ${new Date(dataInicio).toLocaleDateString('pt-BR')} a 
        ${new Date(dataFim).toLocaleDateString('pt-BR')}</p>`;
    } else {
      historicoDiv.innerHTML = "<p>Nenhuma venda registrada ainda.</p>";
    }
    return;
  }

  vendasParaExibir.forEach(venda => {
    const vendaItem = document.createElement("div");
    vendaItem.className = "vendaItem";
    
    const valorFormatado = typeof venda.valor === 'number' ? venda.valor.toFixed(2) : "0.00";
    const categoriaBadge = venda.categoria === "servico" ? '<span style="background: #4CAF50; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em; margin-left: 5px;">SERVIÇO</span>' : '';
    
    vendaItem.innerHTML = `
      <p><strong>Data:</strong> ${venda.data}</p>
      <p><strong>Item:</strong> ${venda.codigo} - ${venda.descricao} ${categoriaBadge}</p>
      <p><strong>Quantidade:</strong> ${venda.quantidade}</p>
      <p><strong>Tipo:</strong> ${venda.tipo}</p>
      <p><strong>Pagamento:</strong> ${venda.pagamento}</p>
      <p><strong>Valor:</strong> R$ ${valorFormatado}</p>
      <hr>
    `;
    historicoDiv.appendChild(vendaItem);
  });

  const contador = document.createElement("div");
  contador.style.marginTop = "15px";
  contador.style.fontWeight = "bold";
  contador.style.color = "#1565c0";
  
  if (dataInicio && dataFim) {
    contador.textContent = `Total de ${vendasParaExibir.length} venda(s) no período selecionado.`;
  } else {
    contador.textContent = `Exibindo as 10 vendas mais recentes de um total de ${todasVendas.length}.`;
  }
  
  historicoDiv.appendChild(contador);
}

function gerarRelatorio(dataInicio = null, dataFim = null) {
  const dados = JSON.parse(localStorage.getItem("estoque_chaves")) || estruturaDados;
  const relatorioDiv = document.getElementById("relatorio");
  
  if (!relatorioDiv) return;
  
  let totalVendas = 0;
  let totalCustos = 0;
  let totalComissoes = 0;
  let quantidadeVendas = 0;

  console.log('📊 Gerando relatório para período:', { dataInicio, dataFim });

  // Processar chaves
  if (dados.chaves && Array.isArray(dados.chaves)) {
    dados.chaves.forEach(chave => {
      if (chave.vendas && Array.isArray(chave.vendas)) {
        chave.vendas.forEach(venda => {
          let incluirVenda = true;
          
          if (dataInicio && dataFim) {
            try {
              const dataVenda = converterDataBrasileira(venda.data);
              const inicio = new Date(dataInicio);
              const fim = new Date(dataFim);
              fim.setHours(23, 59, 59, 999);
              
              if (!dataVenda) {
                incluirVenda = false;
              } else {
                incluirVenda = (dataVenda >= inicio && dataVenda <= fim);
              }
            } catch (e) {
              console.error("Erro ao processar data da venda:", venda.data, e);
              incluirVenda = false;
            }
          }
          
          if (incluirVenda) {
            totalVendas += venda.valor || 0;
            totalCustos += (venda.quantidade || 0) * (chave.precoCusto || 0);
            totalComissoes += venda.comissao || 0;
            quantidadeVendas += 1;
          }
        });
      }
    });
  }

  // Processar serviços (sem custo de estoque)
  if (dados.servicos && Array.isArray(dados.servicos)) {
    dados.servicos.forEach(servico => {
      if (servico.vendas && Array.isArray(servico.vendas)) {
        servico.vendas.forEach(venda => {
          let incluirVenda = true;
          
          if (dataInicio && dataFim) {
            try {
              const dataVenda = converterDataBrasileira(venda.data);
              const inicio = new Date(dataInicio);
              const fim = new Date(dataFim);
              fim.setHours(23, 59, 59, 999);
              
              if (!dataVenda) {
                incluirVenda = false;
              } else {
                incluirVenda = (dataVenda >= inicio && dataVenda <= fim);
              }
            } catch (e) {
              console.error("Erro ao processar data da venda:", venda.data, e);
              incluirVenda = false;
            }
          }
          
          if (incluirVenda) {
            totalVendas += venda.valor || 0;
            // Serviços não têm custo de estoque
            totalComissoes += venda.comissao || 0;
            quantidadeVendas += 1;
          }
        });
      }
    });
  }
  
  const lucro = totalVendas - totalCustos - totalComissoes;
  const lucroBruto = totalVendas - totalCustos;
  
  console.log('📈 Resultados do relatório:', {
    totalVendas,
    totalCustos,
    totalComissoes,
    quantidadeVendas,
    lucro,
    lucroBruto
  });
  
  relatorioDiv.innerHTML = `
    <p><strong>Total em Vendas:</strong> R$ ${totalVendas.toFixed(2)}</p>
    <p><strong>Total de Custos:</strong> R$ ${totalCustos.toFixed(2)}</p>
    <p><strong>Total em Comissões:</strong> R$ ${totalComissoes.toFixed(2)}</p>
    <p><strong>Lucro Bruto:</strong> R$ ${lucroBruto.toFixed(2)}</p>
    <p><strong>Lucro Líquido:</strong> R$ ${lucro.toFixed(2)}</p>
    <p><strong>Quantidade de Vendas:</strong> ${quantidadeVendas}</p>
    <p><strong>Período:</strong> ${dataInicio && dataFim ? 
      `${new Date(dataInicio).toLocaleDateString('pt-BR')} a ${new Date(dataFim).toLocaleDateString('pt-BR')}` : 
      'Todo o período'}</p>
  `;
}

// Sistema de estoque e serviços
function carregarEstoque() {
  const dados = JSON.parse(localStorage.getItem("estoque_chaves")) || estruturaDados;
  const listaEstoque = document.getElementById("listaEstoque");
  
  if (!listaEstoque) return;
  
  listaEstoque.innerHTML = "";
  
  const temChaves = dados.chaves && dados.chaves.length > 0;
  const temServicos = dados.servicos && dados.servicos.length > 0;

  if (!temChaves && !temServicos) {
    listaEstoque.innerHTML = "<p>Nenhum item cadastrado no estoque.</p>";
    return;
  }

  // Mostrar chaves
  if (temChaves) {
    const tituloChaves = document.createElement("h3");
    tituloChaves.textContent = "Chaves";
    tituloChaves.style.marginTop = "20px";
    tituloChaves.style.color = "#1565c0";
    listaEstoque.appendChild(tituloChaves);

    dados.chaves.forEach(chave => {
      const item = document.createElement("div");
      item.className = "item-estoque";
      
      const alertaQuadro = (chave.quadro || 0) < 5 ? "alerta-baixo" : "";
      
      const precoCusto = typeof chave.precoCusto === 'number' ? chave.precoCusto.toFixed(2) : "0.00";
      const precoVenda = typeof chave.precoVenda === 'number' ? chave.precoVenda.toFixed(2) : "0.00";
      const precoCopia = typeof chave.precoCopia === 'number' ? chave.precoCopia.toFixed(2) : 
                        (dados.config.precos ? dados.config.precos.copia.toFixed(2) : "10.00");
      
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
          <button onclick="editarItem('${chave.codigo}', 'chave')">Editar</button>
          <button class="btn-danger" onclick="excluirItem('${chave.codigo}', 'chave')">Excluir</button>
        </div>
        <hr>
      `;
      listaEstoque.appendChild(item);
    });
  }

  // Mostrar serviços
  if (temServicos) {
    const tituloServicos = document.createElement("h3");
    tituloServicos.textContent = "Serviços";
    tituloServicos.style.marginTop = "20px";
    tituloServicos.style.color = "#4CAF50";
    listaEstoque.appendChild(tituloServicos);

    dados.servicos.forEach(servico => {
      const item = document.createElement("div");
      item.className = "item-estoque servico-item";
      
      const preco = typeof servico.preco === 'number' ? servico.preco.toFixed(2) : "0.00";
      
      item.innerHTML = `
        <div class="servico-info">
          <p><strong>Código:</strong> ${servico.codigo || "N/A"}</p>
          <p><strong>Descrição:</strong> ${servico.descricao || "N/A"}</p>
          <p><strong>Preço:</strong> R$ ${preco}</p>
          <p><strong>Tipo:</strong> Serviço (sem estoque)</p>
        </div>
        <div class="servico-actions">
          <button onclick="editarItem('${servico.codigo}', 'servico')">Editar</button>
          <button class="btn-danger" onclick="excluirItem('${servico.codigo}', 'servico')">Excluir</button>
        </div>
        <hr>
      `;
      listaEstoque.appendChild(item);
    });
  }
}

function reabastecerChavePrompt(codigo, tipo) {
  const quantidade = parseInt(prompt(`Quantas unidades deseja adicionar ao ${tipo}?`));
  
  if (isNaN(quantidade) || quantidade <= 0) {
    alert("Quantidade inválida!");
    return;
  }
  
  reabastecerChave(codigo, tipo, quantidade);
}

function editarItem(codigo, tipo) {
  const dados = JSON.parse(localStorage.getItem("estoque_chaves")) || estruturaDados;
  
  if (tipo === 'chave') {
    const chaveIndex = dados.chaves.findIndex(chave => chave.codigo === codigo);
    
    if (chaveIndex === -1) {
      alert("Chave não encontrada.");
      return;
    }
    
    const chave = dados.chaves[chaveIndex];
      
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
    
  } else if (tipo === 'servico') {
    const servicoIndex = dados.servicos.findIndex(servico => servico.codigo === codigo);
    
    if (servicoIndex === -1) {
      alert("Serviço não encontrado.");
      return;
    }
    
    const servico = dados.servicos[servicoIndex];
      
    const novaDescricao = prompt("Nova descrição:", servico.descricao);
    const novoPreco = parseFloat(prompt("Novo preço:", servico.preco));

    if (!novaDescricao || isNaN(novoPreco) || novoPreco < 0) {
      alert("Valores inválidos! Operação cancelada.");
      return;  
    }
    
    dados.servicos[servicoIndex] = {
      ...servico,
      descricao: novaDescricao,
      preco: novoPreco
    };
  }
  
  localStorage.setItem("estoque_chaves", JSON.stringify(dados));
  alert("Item atualizado com sucesso!");
  carregarEstoque();
}

function excluirItem(codigo, tipo) {
  if (!confirm(`Tem certeza que deseja excluir o ${tipo} ${codigo}? Todas as vendas relacionadas serão perdidas.`)) {
    return;
  }
  
  const dados = JSON.parse(localStorage.getItem("estoque_chaves")) || estruturaDados;
  
  if (tipo === 'chave') {
    dados.chaves = dados.chaves.filter(chave => chave.codigo !== codigo);
  } else if (tipo === 'servico') {
    dados.servicos = dados.servicos.filter(servico => servico.codigo !== codigo);
  }

  localStorage.setItem("estoque_chaves", JSON.stringify(dados));
  alert(`${tipo === 'chave' ? 'Chave' : 'Serviço'} excluído com sucesso!`);
  
  if (typeof carregarEstoque === 'function') {
    carregarEstoque();
  }
}

function reabastecerChave(codigo, tipo, quantidade) {
  const dados = JSON.parse(localStorage.getItem("estoque_chaves")) || estruturaDados;
  const chaveIndex = dados.chaves.findIndex(chave => chave.codigo === codigo);
  
  if (chaveIndex === -1) {
    alert("Chave não encontrada.");
    return false;
  }

  const chave = dados.chaves[chaveIndex];
  
  if (tipo === "estoque") {
    chave.estoque += quantidade;
    alert(`Estoque da chave ${codigo} reabastecido em ${quantidade}. Novo estoque: ${chave.estoque}`);
  } else if (tipo === "quadro") {
    if (chave.quadro + quantidade > chave.estoque) {
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

function adicionarChave() {
    const tipo = document.getElementById('tipo').value;
    const codigo = document.getElementById('codigo').value.trim();
    const descricao = document.getElementById('descricao').value.trim();
    const precoCusto = parseFloat(document.getElementById('precoCusto').value);
    const precoVenda = parseFloat(document.getElementById('precoVenda').value);
    const estoqueInicial = parseInt(document.getElementById('quantidade').value);
    const quadro = parseInt(document.getElementById('quadro').value);
    
    if (!codigo || !descricao) {
        alert('Por favor, preencha todos os campos.');
        return;
    }
    
    const dados = JSON.parse(localStorage.getItem('estoque_chaves')) || estruturaDados;
    
    if (tipo === 'chave') {
        const precoCopia = parseFloat(document.getElementById('precoCopia').value);
        
        if (isNaN(precoCusto) || precoCusto < 0 || 
            isNaN(precoVenda) || precoVenda < 0 || 
            isNaN(estoqueInicial) || estoqueInicial < 0 ||
            isNaN(quadro) || quadro < 0 || quadro > estoqueInicial) {
            alert('Por favor, insira valores válidos. O quadro não pode ser maior que o estoque.');
            return;
        }
        
        if (dados.chaves.some(chave => chave.codigo === codigo)) {
            alert('Já existe uma chave com este código.');
            return;
        }
        
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
        
    } else if (tipo === 'servico') {
        // Para serviços, não usamos estoque, quadro, precoCopia
        if (isNaN(precoVenda) || precoVenda < 0) {
            alert('Por favor, insira um preço de venda válido para o serviço.');
            return;
        }
        
        // Verificar se o código já existe em serviços ou chaves
        if ((dados.servicos && dados.servicos.some(servico => servico.codigo === codigo)) || 
            dados.chaves.some(chave => chave.codigo === codigo)) {
            alert('Já existe um item com este código.');
            return;
        }
        
        // Garantir que o array de serviços existe
        if (!dados.servicos) {
            dados.servicos = [];
        }
        
        dados.servicos.push({
            codigo: codigo,
            descricao: descricao,
            preco: precoVenda, // usamos o precoVenda como preço do serviço
            tipo: "servico",
            vendas: []
        });
        
    } else if (tipo === 'produto') {
        // Para produtos, usamos estoque, precoCusto, precoVenda, mas não usamos precoCopia
        if (isNaN(precoCusto) || precoCusto < 0 || 
            isNaN(precoVenda) || precoVenda < 0 || 
            isNaN(estoqueInicial) || estoqueInicial < 0) {
            alert('Por favor, insira valores válidos para o produto.');
            return;
        }
        
        // Verificar se o código já existe
        if (dados.chaves.some(chave => chave.codigo === codigo) || 
            (dados.servicos && dados.servicos.some(servico => servico.codigo === codigo))) {
            alert('Já existe um item com este código.');
            return;
        }
        
        // Adicionar produto às chaves (ou criar um array separado se preferir)
        dados.chaves.push({
            codigo: codigo,
            descricao: descricao,
            estoque: estoqueInicial,
            quadro: 0, // produtos não ficam no quadro
            precoCusto: precoCusto,
            precoVenda: precoVenda,
            precoCopia: 0, // produtos não têm preço de cópia
            vendas: [],
            tipo: "produto" // marca como produto
        });
    }
    
    localStorage.setItem('estoque_chaves', JSON.stringify(dados));
    document.getElementById('formAdicionarChave').reset();
    alert(`Item "${codigo}" adicionado com sucesso!`);
    
    setTimeout(() => {
        window.location.href = 'estoque.html';
    }, 1000);
}
// Função para adicionar serviços
function adicionarServico() {
  const codigo = document.getElementById('codigoServico').value.trim();
  const descricao = document.getElementById('descricaoServico').value.trim();
  const preco = parseFloat(document.getElementById('precoServico').value);
  
  if (!codigo || !descricao) {
    alert('Por favor, preencha todos os campos.');
    return;
  }
  
  if (isNaN(preco) || preco < 0) {
    alert('Por favor, insira um preço válido.');
    return;
  }
  
  const dados = JSON.parse(localStorage.getItem('estoque_chaves')) || estruturaDados;
  
  // Verificar se código já existe em chaves ou serviços
  if (dados.chaves.some(chave => chave.codigo === codigo) || 
      (dados.servicos && dados.servicos.some(servico => servico.codigo === codigo))) {
    alert('Já existe um item com este código.');
    return;
  }
  
  // Garantir que o array de serviços existe
  if (!dados.servicos) {
    dados.servicos = [];
  }
  
  dados.servicos.push({
    codigo: codigo,
    descricao: descricao,
    preco: preco,
    tipo: "servico",
    vendas: []
  });
  
  localStorage.setItem('estoque_chaves', JSON.stringify(dados));
  document.getElementById('formAdicionarServico').reset();
  alert(`Serviço "${descricao}" adicionado com sucesso!`);
  
  setTimeout(() => {
    window.location.href = 'estoque.html';
  }, 1000);
}

// Sistema de gráficos
function criarGraficos(dataInicio = null, dataFim = null) {
  console.log('📊 Criando gráficos com filtros:', { dataInicio, dataFim });
  
  if (typeof Chart === 'undefined') {
    console.error('❌ Chart.js não está carregado!');
    return;
  }
  
  if (!document.getElementById('graficoPizza')) {
    console.log('ℹ️ Gráficos não disponíveis nesta página');
    return;
  }
  
  const dados = JSON.parse(localStorage.getItem("estoque_chaves")) || estruturaDados;
  
  destruirGraficos();
  criarGraficoPizza(dados, dataInicio, dataFim);
  criarGraficoBarras(dados, dataInicio, dataFim);
  criarGraficoLinhas(dados, dataInicio, dataFim);
}

function destruirGraficos() {
  const graficos = ['graficoPizza', 'graficoBarras', 'graficoLinhas'];
  
  graficos.forEach(id => {
    const canvas = document.getElementById(id);
    if (canvas) {
      const chartInstance = Chart.getChart(canvas);
      if (chartInstance) {
        chartInstance.destroy();
      }
    }
  });
}

function filtrarVendasPorData(dados, dataInicio = null, dataFim = null) {
  let todasVendas = [];
  console.log('🔍 Filtrando vendas por data:', { dataInicio, dataFim });

  // Coletar vendas de chaves
  if (dados.chaves && Array.isArray(dados.chaves)) {
    dados.chaves.forEach(chave => {
      if (chave.vendas && Array.isArray(chave.vendas)) {
        chave.vendas.forEach(venda => {
          todasVendas.push({
            ...venda,
            codigo: chave.codigo,
            descricao: chave.descricao,
            categoria: "chave"
          });
        });
      }
    });
  }

  // Coletar vendas de serviços
  if (dados.servicos && Array.isArray(dados.servicos)) {
    dados.servicos.forEach(servico => {
      if (servico.vendas && Array.isArray(servico.vendas)) {
        servico.vendas.forEach(venda => {
          todasVendas.push({
            ...venda,
            codigo: servico.codigo,
            descricao: servico.descricao,
            categoria: "servico"
          });
        });
      }
    });
  }
  
  if (dataInicio && dataFim) {
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    fim.setHours(23, 59, 59, 999);

    todasVendas = todasVendas.filter(venda => {
      try {
        const dataVenda = converterDataBrasileira(venda.data);
        
        if (!dataVenda) {
          console.log('❌ Venda com data inválida excluída:', venda.data);
          return false;
        }
        
        const dentroDoPeriodo = dataVenda >= inicio && dataVenda <= fim;
        
        if (dentroDoPeriodo) {
          console.log('✅ Venda incluída no gráfico:', {
            data: venda.data,
            dataConvertida: dataVenda,
            valor: venda.valor
          });
        }
        
        return dentroDoPeriodo;
      } catch (e) {
        console.error("Erro ao processar data da venda:", venda.data, e);
        return false;
      }
    });
  }
  
  console.log(`📊 Total de vendas após filtro: ${todasVendas.length}`);
  return todasVendas;
}

function formatarDataPeriodo(dataInicio, dataFim) {
  const inicio = new Date(dataInicio).toLocaleDateString('pt-BR');
  const fim = new Date(dataFim).toLocaleDateString('pt-BR');
  return `${inicio} a ${fim}`;
}

function criarGraficoPizza(dados, dataInicio = null, dataFim = null) {
  const ctx = document.getElementById('graficoPizza');
  if (!ctx) return;
  
  const tiposVenda = {};
  const vendasFiltradas = filtrarVendasPorData(dados, dataInicio, dataFim);

  vendasFiltradas.forEach(venda => {
    const tipo = venda.categoria === "servico" ? "servico" : venda.tipo;
    tiposVenda[tipo] = (tiposVenda[tipo] || 0) + 1;
  });

  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: Object.keys(tiposVenda),
      datasets: [{
        data: Object.values(tiposVenda),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: dataInicio && dataFim 
            ? `Distribuição de Vendas (${formatarDataPeriodo(dataInicio, dataFim)})`
            : 'Distribuição de Vendas (Todo Período)'
        }
      }
    }
  });
}

function criarGraficoBarras(dados, dataInicio = null, dataFim = null) {
  const ctx = document.getElementById('graficoBarras');
  if (!ctx) return;
  
  const vendasPorItem = {};
  const vendasFiltradas = filtrarVendasPorData(dados, dataInicio, dataFim);

  vendasFiltradas.forEach(venda => {
    const chave = `${venda.codigo} - ${venda.descricao}`;
    vendasPorItem[chave] = (vendasPorItem[chave] || 0) + venda.valor;
  });

  const itensOrdenados = Object.entries(vendasPorItem)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: itensOrdenados.map(([item]) => item),
      datasets: [{
        label: 'Total em Vendas (R$)',
        data: itensOrdenados.map(([,valor]) => valor),
        backgroundColor: '#36A2EB'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: dataInicio && dataFim 
            ? `Top 10 Itens em Vendas (${formatarDataPeriodo(dataInicio, dataFim)})`
            : 'Top 10 Itens em Vendas (Todo Período)'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return 'R$ ' + value.toFixed(2);
            }
          }
        }
      }
    }
  });
}

function criarGraficoLinhas(dados, dataInicio = null, dataFim = null) {
  const ctx = document.getElementById('graficoLinhas');
  if (!ctx) return;
  
  const vendasPorDia = {};
  const vendasFiltradas = filtrarVendasPorData(dados, dataInicio, dataFim);

  vendasFiltradas.forEach(venda => {
    const data = venda.data.split(' ')[0];
    vendasPorDia[data] = (vendasPorDia[data] || 0) + venda.valor;
  });
  
  const datasOrdenadas = Object.keys(vendasPorDia).sort((a, b) => {
    const [diaA, mesA, anoA] = a.split('/').map(Number);
    const [diaB, mesB, anoB] = b.split('/').map(Number);
    return new Date(anoA, mesA - 1, diaA) - new Date(anoB, mesB - 1, diaB);
  });

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: datasOrdenadas,
      datasets: [{
        label: 'Vendas por Dia (R$)',
        data: datasOrdenadas.map(data => vendasPorDia[data]),
        borderColor: '#FF6384',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        tension: 0.1,
        fill: true
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: dataInicio && dataFim 
            ? `Evolução de Vendas (${formatarDataPeriodo(dataInicio, dataFim)})`
            : 'Evolução de Vendas (Todo Período)'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return 'R$ ' + value.toFixed(2);
            }
          }
        }
      }
    }
  });
}

// Sistema de backup
function fazerBackupAutomatico() {
  const dadosAtuais = JSON.parse(localStorage.getItem("estoque_chaves")) || estruturaDados;
  const backups = JSON.parse(localStorage.getItem(BACKUP_CONFIG.backupKey)) || [];

  const novoBackup = {
    id: Date.now(),
    data: new Date().toISOString(),
    dados: dadosAtuais,
    tipo: "automatico"
  };

  backups.unshift(novoBackup);
  const backupsLimitados = backups.slice(0, BACKUP_CONFIG.maxBackups);
  localStorage.setItem(BACKUP_CONFIG.backupKey, JSON.stringify(backupsLimitados));
  console.log(`Backup automático realizado - ${new Date().toLocaleString('pt-BR')}`);
}

function verificarBackupSemanal() {
  const ultimoBackupStr = localStorage.getItem('ultimo_backup');
  const agora = new Date();

  if (!ultimoBackupStr) {
    fazerBackupAutomatico();
    localStorage.setItem('ultimo_backup', agora.toISOString());
    return;
  }
  
  const ultimoBackup = new Date(ultimoBackupStr);
  const diferencaDias = Math.floor((agora - ultimoBackup) / (1000 * 60 * 60 * 24));

  if (diferencaDias >= 7) {
    fazerBackupAutomatico();
    localStorage.setItem('ultimo_backup', agora.toISOString());
    console.log(`Backup semanal realizado após ${diferencaDias} dias`);
  }
}

function restaurarBackup(backupId) {
  const backups = JSON.parse(localStorage.getItem(BACKUP_CONFIG.backupKey)) || [];
  const backup = backups.find(b => b.id === backupId);

  if (!backup) {
    alert("Backup não encontrado.");
    return;
  }
  
  if (confirm(`Deseja restaurar o backup de ${new Date(backup.data).toLocaleString('pt-BR')}? Isso substituirá todos os dados atuais.`)) {
    localStorage.setItem("estoque_chaves", JSON.stringify(backup.dados));
    alert("Backup restaurado com sucesso! A página será recarregada.");
    location.reload();
  }
}

function gerenciarBackups() {
  const backups = JSON.parse(localStorage.getItem(BACKUP_CONFIG.backupKey)) || [];
  
  if (backups.length === 0) {
    alert("Nenhum backup encontrado.");
    return;
  }

  let mensagem = "📦 Backups disponíveis:\n\n";
  backups.forEach((backup, index) => {
    const data = new Date(backup.data).toLocaleString('pt-BR');
    mensagem += `${index + 1}. ${data} (${backup.tipo})\n`;
  });
  
  mensagem += "\nDigite o número do backup que deseja restaurar (0 para cancelar):";
  const escolha = prompt(mensagem);
  const indexEscolhido = parseInt(escolha) - 1;
  
  if (indexEscolhido >= 0 && indexEscolhido < backups.length) {
    restaurarBackup(backups[indexEscolhido].id);
  }
}

function fazerBackupManual() {
  fazerBackupAutomatico();
  alert("Backup manual realizado com sucesso!");
}

function adicionarBotoesBackup() {
  if (document.querySelector('.backup-container')) return;
  
  if (document.getElementById('listaEstoque')) {
    const backupSection = document.createElement('div');
    backupSection.className = 'backup-container';
    backupSection.innerHTML = `
      <h2>💾 Sistema de Backup</h2>
      <button onclick="fazerBackupManual()">Fazer Backup Manual</button>
      <button onclick="gerenciarBackups()">Gerenciar Backups</button>
      <p style="font-size: 14px; margin-top: 10px; color: #666;">
        Backups automáticos semanais • Mantidos últimos ${BACKUP_CONFIG.maxBackups} backups
      </p>
    `;

    const estoqueContainer = document.querySelector('.estoque-container');
    if (estoqueContainer) {
      estoqueContainer.parentNode.insertBefore(backupSection, estoqueContainer);
    }
  }
}

// Sistema de autocomplete
function adicionarContainerSugestoes() {
  if (document.getElementById("codigoDaChave")) {
    const existingContainer = document.getElementById("sugestoes-container");
    if (existingContainer) return;

    const container = document.createElement("div");
    container.id = "sugestoes-container";
    container.className = `sugestoes-container`;
    container.style.display = "none";

    const inputContainer = document.getElementById("codigoDaChave").parentNode;
    inputContainer.appendChild(container);
  }
}

function mostrarSugestoes(sugestoes) { 
  const containerSugestoes = document.getElementById("sugestoes-container");
  if (!containerSugestoes) return;

  containerSugestoes.innerHTML = ""; 

  if (sugestoes.length === 0) {
    containerSugestoes.style.display = "none";
    return;
  }

  const sugestoesLimitadas = sugestoes.slice(0, 5);

  sugestoesLimitadas.forEach(sugestao => {
    const item = document.createElement("div");
    item.className = "sugestao-item";
    const tipo = sugestao.tipo === "servico" ? "🔧 SERVICO" : "🔑 CHAVE";
    const estoqueInfo = sugestao.tipo === "servico" ? "" : `<span class="sugestao-estoque">(${sugestao.estoque} em estoque)</span>`;
    
    item.innerHTML = `
      <strong>${sugestao.codigo}</strong> - ${sugestao.descricao} 
      <span style="background: ${sugestao.tipo === 'servico' ? '#4CAF50' : '#2196F3'}; color: white; padding: 1px 4px; border-radius: 3px; font-size: 0.7em; margin-left: 5px;">${tipo}</span>
      ${estoqueInfo}
    `;

    item.addEventListener('click', () => {
      selecionarSugestao(sugestao);
    });
    
    containerSugestoes.appendChild(item);
  });
  
  containerSugestoes.style.display = "block";
}

function selecionarSugestao(sugestao) {
  const inputCodigo = document.getElementById("codigoDaChave");
  const inputQuantidade = document.getElementById("quantidade");

  if (inputCodigo) {
    inputCodigo.value = sugestao.codigo;
  }

  if (inputQuantidade) {
    inputQuantidade.value = 1;
    inputQuantidade.focus();
  }

  const containerSugestoes = document.getElementById("sugestoes-container");
  if (containerSugestoes) {
    containerSugestoes.style.display = "none";
  }
}

function buscarSugestoes(termo) {
  const dados = JSON.parse(localStorage.getItem("estoque_chaves")) || estruturaDados;

  if (!termo || termo.length < 2) {
    return [];
  }

  const termoLower = termo.toLowerCase();

  const sugestoesChaves = dados.chaves.filter(chave => {
    return (
      chave.codigo.toLowerCase().includes(termoLower) ||
      chave.descricao.toLowerCase().includes(termoLower)
    );
  }).map(chave => ({...chave, tipo: "chave"}));

  const sugestoesServicos = dados.servicos ? dados.servicos.filter(servico => {
    return (
      servico.codigo.toLowerCase().includes(termoLower) ||
      servico.descricao.toLowerCase().includes(termoLower)
    );
  }).map(servico => ({...servico, tipo: "servico"})) : [];

  return [...sugestoesChaves, ...sugestoesServicos];
}

function configurarAutoComplete() {
  const inputCodigo = document.getElementById("codigoDaChave");
  const containerSugestoes = document.getElementById("sugestoes-container");

  if (!inputCodigo || !containerSugestoes) return;

  inputCodigo.addEventListener("input", function() {
    const termo = this.value.trim();
    const sugestoes = buscarSugestoes(termo);
    sugestoesAtuais = sugestoes;
    mostrarSugestoes(sugestoes);
  });

  document.addEventListener("click", function(event) {
    if (!containerSugestoes.contains(event.target) && event.target !== inputCodigo) {
      containerSugestoes.style.display = "none";
    }
  });

  let sugestaoIndex = -1;

  inputCodigo.addEventListener("keydown", function(event) {
    const sugestoesVisiveis = Array.from(document.querySelectorAll(".sugestao-item"));

    if (sugestoesVisiveis.length === 0) {
      sugestaoIndex = -1;
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      sugestaoIndex = (sugestaoIndex + 1) % sugestoesVisiveis.length;
      sugestoesVisiveis.forEach((item, idx) => {
        item.classList.toggle("active", idx === sugestaoIndex);
      });
      sugestoesVisiveis[sugestaoIndex].scrollIntoView({ block: "nearest" });
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      sugestaoIndex = (sugestaoIndex - 1 + sugestoesVisiveis.length) % sugestoesVisiveis.length;
      sugestoesVisiveis.forEach((item, idx) => {
        item.classList.toggle("active", idx === sugestaoIndex);
      });
      sugestoesVisiveis[sugestaoIndex].scrollIntoView({ block: "nearest" });
    } else if (event.key === "Enter" && sugestaoIndex >= 0) {
      event.preventDefault();
      sugestoesVisiveis[sugestaoIndex].click();
      sugestaoIndex = -1;
    } else if (event.key === "Escape") {
      const containerSugestoes = document.getElementById("sugestoes-container");
      if (containerSugestoes) containerSugestoes.style.display = "none";
      sugestaoIndex = -1;
    }
  });
}

// Funções utilitárias
function normalizarCodigo(codigo) {
  return codigo.trim().toLowerCase().replace(/\s+/g, '');
}

function buscarItem(codigo) {
  const dados = JSON.parse(localStorage.getItem("estoque_chaves")) || estruturaDados;
  const codigoNormalizado = normalizarCodigo(codigo);

  const chave = dados.chaves.find(chave => 
    normalizarCodigo(chave.codigo) === codigoNormalizado
  );

  if (chave) return {item: chave, tipo: "chave"};

  const servico = dados.servicos ? dados.servicos.find(servico => 
    normalizarCodigo(servico.codigo) === codigoNormalizado
  ) : null;

  if (servico) return {item: servico, tipo: "servico"};

  return null;
}

// Sistema de exportação/importação
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

      if (dadosImportados && (dadosImportados.chaves || dadosImportados.servicos)) {
        if (confirm("Dados válidos encontrados. Deseja restaurar o backup? Isso substituirá todos os dados atuais.")) {
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

// Funções de debug
function debugDatasVendas() {
  const dados = JSON.parse(localStorage.getItem("estoque_chaves")) || estruturaDados;
  const todasDatas = [];
  
  if (dados.chaves && Array.isArray(dados.chaves)) {
    dados.chaves.forEach(chave => {
      if (chave.vendas && Array.isArray(chave.vendas)) {
        chave.vendas.forEach(venda => {
          if (venda.data) {
            const dataConvertida = converterDataBrasileira(venda.data);
            todasDatas.push({
              original: venda.data,
              convertida: dataConvertida,
              valida: !!dataConvertida,
              timestamp: venda.timestamp
            });
          }
        });
      }
    });
  }
  
  console.log('=== 🧪 DEBUG DE DATAS ===');
  console.log('Total de vendas:', todasDatas.length);
  console.log('Datas válidas:', todasDatas.filter(d => d.valida).length);
  console.log('Datas inválidas:', todasDatas.filter(d => !d.valida).length);
  console.log('Com timestamp:', todasDatas.filter(d => d.timestamp).length);
  console.log('Amostra de datas:', todasDatas.slice(0, 5));
  console.log('=== FIM DEBUG ===');
  
  return todasDatas;
}

function adicionarBotaoDebug() {
  if (document.getElementById('debugButton')) return;
  
  const debugBtn = document.createElement('button');
  debugBtn.id = 'debugButton';
  debugBtn.textContent = '🐛 Debug Datas';
  debugBtn.style.position = 'fixed';
  debugBtn.style.top = '10px';
  debugBtn.style.left = '10px';
  debugBtn.style.zIndex = '10000';
  debugBtn.style.background = '#ff4444';
  debugBtn.style.color = 'white';
  debugBtn.style.border = 'none';
  debugBtn.style.padding = '10px';
  debugBtn.style.borderRadius = '5px';
  debugBtn.style.cursor = 'pointer';
  
  debugBtn.onclick = function() {
    debugDatasVendas();
  };
  
  document.body.appendChild(debugBtn);
}

function debugEstoque() {
  const dados = JSON.parse(localStorage.getItem("estoque_chaves")) || estruturaDados;
  console.log("=== DEBUG DO ESTOQUE ===");
  console.log("Dados completos:", dados);
  console.log("Número de chaves:", dados.chaves.length);
  console.log("Número de serviços:", dados.servicos ? dados.servicos.length : 0);
  dados.chaves.forEach((chave, index) => {
    console.log(`Chave ${index + 1}:`, chave);
  });
  if (dados.servicos) {
    dados.servicos.forEach((servico, index) => {
      console.log(`Servico ${index + 1}:`, servico);
    });
  }
  console.log("========================");
}

// Controle de visibilidade do campo Preço para Cópia
function togglePrecoCopia() {
    const tipo = document.getElementById('tipo');
    const precoCopiaGroup = document.getElementById('precoCopiaGroup');
    
    if (tipo && precoCopiaGroup) {
        if (tipo.value === 'chave') {
            precoCopiaGroup.style.display = 'block';
        } else {
            precoCopiaGroup.style.display = 'none';
        }
    }
}

function debugFiltros() {
  const dataInicio = document.getElementById("dataInicio").value;
  const dataFim = document.getElementById("dataFim").value;
  
  console.log('=== DEBUG FILTROS ===');
  console.log('Data Início:', dataInicio);
  console.log('Data Fim:', dataFim);
  console.log('Função criarGraficos existe:', typeof criarGraficos === 'function');
  console.log('Elemento graficoPizza existe:', !!document.getElementById('graficoPizza'));
  console.log('Chart.js carregado:', typeof Chart !== 'undefined');
}

// Inicialização do sistema
function inicializar() {
  aplicarTemaSalvo();

  if (!localStorage.getItem("estoque_chaves")) {
    localStorage.setItem("estoque_chaves", JSON.stringify(estruturaDados));
  }

  verificarBackupSemanal();
  adicionarBotoesBackup();
  adicionarContainerSugestoes();
  configurarAutoComplete();
  carregarProfissionaisNoSelect();

 const tipoSelect = document.getElementById('tipo');
    if (tipoSelect) {
        tipoSelect.addEventListener('change', togglePrecoCopia);
        // Executar uma vez para definir o estado inicial
        togglePrecoCopia();
    }

       

  if (document.getElementById("graficoPizza")) {
    criarGraficos();
  }
  
  if (document.getElementById("historicoVendas")) {
    carregarHistorico();
  }
  
  if (document.getElementById("listaEstoque")) {
    carregarEstoque();
  }

  if (document.getElementById('formAdicionarChave')) {
    document.getElementById("formAdicionarChave").addEventListener("submit", function(e) {
      e.preventDefault();
      adicionarChave();
    });
  }

  if (document.getElementById('formAdicionarServico')) {
    document.getElementById("formAdicionarServico").addEventListener("submit", function(e) {
      e.preventDefault();
      adicionarServico();
    });
  }
  
  const backups = JSON.parse(localStorage.getItem(BACKUP_CONFIG.backupKey)) || [];
  console.log(`Sistema iniciado. ${backups.length} backups disponíveis.`);
}

document.addEventListener("DOMContentLoaded", inicializar);