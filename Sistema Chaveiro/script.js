// como os dados serão armazenados
const estruturaDados = {
  chaves: [
    {
      codigo: "CH001",
      descricao: "Chave",
      estoque: 50,
      precoCusto: 0.80,
      precoVenda: 1.80,
      vendas: []
    }
  ],
  config: {
    precos: {
      copia: 10.00,
      perca: 0.00,
      venda: 1.80
    },
    tema: "claro"
  }
};
function alterarTema() {
      document.body.classList.toggle('dark-mode');
    }

function registrarVenda() {
  const codigoChave = document.getElementById("codigoChave").value.trim();
  const quantidade = parseInt(document.getElementById("quantidade").value);
  const tipoVenda = document.getElementById("tipoVenda").value;
  const pagamento = document.getElementById("pagamento").value;

  if(!codigoChave || isNaN(quantidade) || quantidade <= 0) {
    alert("Por favor, preencha todos os campos corretamente.");
    return;
  }
   let dados = JSON.parse(localStorage.getItem("estoque_chaves")) || estruturaDados;
   const chaveIndex = dados.chaves.findIndex(chave => c.codigo === codigo);

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
    if(tipoVenda === "copia") {
      valorVenda = dados.config.precos.copia * quantidade;
    }
    else if(tipoVenda === "venda") {
      valorVenda = chave.precoVenda * quantidade;
    }
    chave.estoque -= quantidade;

    chave.vendas.push({
    data: new date().tolocaleString("pt-br"),
    quantidade: quantidade,
    tipo: tipoVenda,
    valor: valorVenda,
    pagamento: pagamento
    });

    localStorage.setItem("estoque_chaves", JSON.stringify(dados));
    document.getElementById("codigoChave").value = "";
    document.getElementById("quantidade").value = "";
    alert("Venda registrada com sucesso! Valor total: R$ ${valorVenda.toFixed(2)}");
  }

  function carregarHistorico() {
    const dados = JSON.parse(localStorage.getItem("estoque_chaves")) || estruturaDados;
    const historicoDiv = document.getElementById("historicoVendas");
   
    historicoDiv.innerHTML = " ";
    
    dados.chaves.forEach(chave => {
      chave.vendas.forEach(venda => {
        todasVendas.push({
          data: venda.data,
          codigo: chave.codigo,
          quantidade: venda.quantidade,
          tipo: venda.tipo,
          pagamento: venda.pagamento,
          valor: venda.valor,
        });
      });
    });

    todasVendas.sort((a, b) => new Date(b.data) - new Date(a.data));
    
    const ultimasVendas = todasVendas.slice(0, 10);

    if(ultimasVendas.length === 0) {
      historicoDiv.innerHTML = "<p>Nenhuma venda registrada ainda.</p>";
      return;
    }

    ultimasVendas.forEach(venda => {
      const vendaItem = document.createElement("div");
      vendaItem.className = "vendaItem";
      vendaItem.innerHTML = `
            <p><strong>Data:</strong> ${venda.data}</p>
            <p><strong>Chave:</strong> ${venda.codigo}</p>
            <p><strong>Quantidade:</strong> ${venda.quantidade}</p>
            <p><strong>Tipo:</strong> ${venda.tipo}</p>
            <p><strong>Pagamento:</strong> ${venda.pagamento}</p>
            <p><strong>Valor:</strong> R$ ${venda.valor.toFixed(2)}</p>
            <hr>
        `;
        historicoDiv.appendChild(vendaItem);
    });
    }



    function inicializar() {
      if(!localStorage.getItem("estoque_chaves")) {
        localStorage.setItem("estoque_chaves", JSON.stringify(estruturaDados));
      }
      if(document.getElementById("historicoVendas")) {
        carregarHistorico();
      }
      if(document.getElementById("listaestoque")) {
        carregarHistorico();
      }
    }
