let produtos = JSON.parse(localStorage.getItem("shopping_list_data")) || [];

const listaDOM = document.getElementById("listaCompras");
const btnAdd = document.getElementById("btnAddItem");
const btnReset = document.getElementById("btnReset");
const btnCopy = document.getElementById("btnCopyList");
const btnClearAll = document.getElementById("btnClearAll");

// Inicializar Sortable
if (listaDOM) {
    new Sortable(listaDOM, {
        animation: 150,
        handle: '.drag-handle',
        ghostClass: 'sortable-ghost',
        onEnd: () => reordenarArray()
    });
}

function reordenarArray() {
    const novosItens = [];
    const itensHTML = listaDOM.querySelectorAll('.item-compra');
    itensHTML.forEach(el => {
        const id = el.getAttribute('data-id');
        const produto = produtos.find(p => String(p.id) === String(id));
        if (produto) novosItens.push(produto);
    });
    produtos = novosItens;
    salvar();
}

function render() {
    if (!listaDOM) return;
    listaDOM.innerHTML = "";
    
    produtos.forEach((prod) => {
        const div = document.createElement("div");
        div.className = `item-compra ${prod.checked ? 'marcado' : ''}`;
        div.setAttribute('data-id', prod.id);
        
        div.innerHTML = `
            <div class="drag-handle">⠿</div>
            <input type="checkbox" class="check-item" ${prod.checked ? 'checked' : ''}>
            <input type="text" class="input-item" value="${prod.nome}" placeholder="Item...">
            <div class="qty-controls">
                <button class="btn-qty minus">-</button>
                <input type="number" class="input-qty" value="${prod.qtd}" readonly>
                <button class="btn-qty plus">+</button>
            </div>
            <button class="btn-del">×</button>
        `;

        const check = div.querySelector(".check-item");
        const inputNome = div.querySelector(".input-item");
        const btnMinus = div.querySelector(".minus");
        const btnPlus = div.querySelector(".plus");
        const btnDel = div.querySelector(".btn-del");

        check.onchange = () => { prod.checked = check.checked; salvar(); render(); };
        inputNome.onblur = () => { prod.nome = inputNome.value; salvar(); };
        inputNome.onkeydown = (e) => { if(e.key === "Enter") inputNome.blur(); };

        btnMinus.onclick = () => { if (prod.qtd > 1) { prod.qtd--; salvar(); render(); } };
        btnPlus.onclick = () => { prod.qtd++; salvar(); render(); };
        btnDel.onclick = () => { produtos = produtos.filter(p => p.id !== prod.id); salvar(); render(); };

        listaDOM.appendChild(div);
    });
}

// Eventos de Botões
btnAdd.onclick = () => {
    produtos.push({ id: Date.now(), nome: "", qtd: 1, checked: false });
    render();
    const inputs = document.querySelectorAll(".input-item");
    if(inputs.length > 0) inputs[inputs.length - 1].focus();
};

btnReset.onclick = () => {
    if(confirm("Limpar marcações (checks)?")) {
        produtos.forEach(p => p.checked = false);
        salvar();
        render();
    }
};

btnClearAll.onclick = () => {
    if(confirm("ATENÇÃO: Isso apagará TODOS os itens da sua lista. Confirma?")) {
        produtos = [];
        salvar();
        render();
    }
};

btnCopy.onclick = () => {
    if (produtos.length === 0) return alert("A lista está vazia!");
    const textoParaCopiar = produtos.map(p => `${p.nome} x ${p.qtd}`).join('\n');
    navigator.clipboard.writeText(textoParaCopiar).then(() => alert("Lista copiada!"));
};

// --- IMPORTAÇÃO INTELIGENTE ---
const modalImport = document.getElementById("modalImport");
const btnOpenBulk = document.getElementById("btnOpenBulk");
const btnCancelarImport = document.getElementById("btnCancelarImport");
const btnConfirmarImport = document.getElementById("btnConfirmarImport");
const textoListaBulk = document.getElementById("textoListaBulk");

if(btnOpenBulk) btnOpenBulk.onclick = () => modalImport.style.display = "flex";
if(btnCancelarImport) btnCancelarImport.onclick = () => modalImport.style.display = "none";

if(btnConfirmarImport) {
    btnConfirmarImport.onclick = () => {
        const texto = textoListaBulk.value.trim();
        if (texto) {
            texto.split('\n').forEach(linha => {
                let nomeFinal = linha.trim();
                let qtdFinal = 1;

                // Regex para identificar "Nome do Item x 5" ou "Nome do Item x5"
                const regexQtd = /^(.*?)\s+x\s*(\d+)$/i;
                const match = nomeFinal.match(regexQtd);

                if (match) {
                    nomeFinal = match[1].trim(); // Nome do item
                    qtdFinal = parseInt(match[2]); // Quantidade
                }

                if (nomeFinal) {
                    produtos.push({
                        id: Date.now() + Math.random(),
                        nome: nomeFinal,
                        qtd: qtdFinal,
                        checked: false
                    });
                }
            });
            salvar();
            render();
        }
        modalImport.style.display = "none";
        textoListaBulk.value = "";
    };
}

function salvar() {
    localStorage.setItem("shopping_list_data", JSON.stringify(produtos));
}

render();