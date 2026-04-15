let db = JSON.parse(localStorage.getItem("shopping_planetario_db")) || {
    ativoId: Date.now(),
    listas: [{ id: Date.now(), nome: "MINHA LISTA", itens: [], showQty: true }]
};

const listaDOM = document.getElementById("listaCompras");
const tituloLista = document.getElementById("tituloLista");

// Inicializar Sortable
if (listaDOM) {
    new Sortable(listaDOM, {
        animation: 150, handle: '.drag-handle', ghostClass: 'sortable-ghost',
        onEnd: () => reordenarItens()
    });
}

function getListaAtiva() {
    return db.listas.find(l => l.id === db.ativoId) || db.listas[0];
}

function render() {
    const listaAtiva = getListaAtiva();
    tituloLista.innerText = listaAtiva.nome;
    listaDOM.innerHTML = "";
    
    listaAtiva.itens.forEach((prod) => {
        const div = document.createElement("div");
        div.className = `item-compra ${prod.checked ? 'marcado' : ''}`;
        div.setAttribute('data-id', prod.id);
        
        // Lógica do Toggle de Quantidades
        const qtyHtml = (listaAtiva.showQty !== false) ? `
            <div class="qty-controls">
                <button class="btn-qty minus">-</button>
                <input type="number" class="input-qty" value="${prod.qtd}" readonly>
                <button class="btn-qty plus">+</button>
            </div>
        ` : '';

        div.innerHTML = `
            <div class="drag-handle">⠿</div>
            <input type="checkbox" class="check-item" ${prod.checked ? 'checked' : ''}>
            <input type="text" class="input-item" value="${prod.nome}" placeholder="Item...">
            ${qtyHtml}
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
        
        if (btnMinus) btnMinus.onclick = () => { if (prod.qtd > 0) { prod.qtd--; salvar(); render(); } };
        if (btnPlus) btnPlus.onclick = () => { prod.qtd++; salvar(); render(); };
        
        btnDel.onclick = () => { 
            listaAtiva.itens = listaAtiva.itens.filter(p => p.id !== prod.id); 
            salvar(); render(); 
        };

        listaDOM.appendChild(div);
    });
}

// --- MODAIS ---
function abrirModal(id) { document.getElementById(id).style.display = "flex"; }
function fecharModal(id) { document.getElementById(id).style.display = "none"; }

// --- MENU SANDUÍCHE (LISTAS) ---
document.getElementById("btnMenu").onclick = () => {
    const container = document.getElementById("containerMinhasListas");
    container.innerHTML = "";
    db.listas.forEach(l => {
        const btn = document.createElement("div");
        btn.className = `btn-lista-opcao ${l.id === db.ativoId ? 'active' : ''}`;
        btn.innerHTML = `<span>${l.nome}</span> ${db.listas.length > 1 ? '<button class="btn-del-lista" style="background:none; border:none; color:red; font-size:18px;">✖</button>' : ''}`;
        btn.onclick = () => { db.ativoId = l.id; salvar(); render(); fecharModal('modalListas'); };
        const btnDel = btn.querySelector(".btn-del-lista");
        if(btnDel) btnDel.onclick = (e) => {
            e.stopPropagation();
            if(confirm(`Excluir a lista "${l.nome}"?`)) {
                db.listas = db.listas.filter(item => item.id !== l.id);
                if(db.ativoId === l.id) db.ativoId = db.listas[0].id;
                salvar(); fecharModal('modalListas'); render();
            }
        };
        container.appendChild(btn);
    });
    abrirModal('modalListas');
};

document.getElementById("btnCriarLista").onclick = () => {
    const nome = document.getElementById("inputNomeNovaLista").value.trim();
    if(!nome) return alert("Digite um nome!");
    const nova = { id: Date.now(), nome: nome.toUpperCase(), itens: [], showQty: true };
    db.listas.push(nova);
    db.ativoId = nova.id;
    document.getElementById("inputNomeNovaLista").value = "";
    salvar(); fecharModal('modalListas'); render();
};

// --- EDITAR DETALHES ---
document.getElementById("btnEditDetails").onclick = () => {
    const lista = getListaAtiva();
    document.getElementById("inputEditNomeLista").value = lista.nome;
    document.getElementById("toggleShowQty").checked = (lista.showQty !== false);
    abrirModal('modalEditList');
};

document.getElementById("btnSalvarDetalhes").onclick = () => {
    const lista = getListaAtiva();
    const novoNome = document.getElementById("inputEditNomeLista").value.trim().toUpperCase();
    if(!novoNome) return alert("Nome inválido!");
    
    lista.nome = novoNome;
    lista.showQty = document.getElementById("toggleShowQty").checked;
    
    salvar(); render(); fecharModal('modalEditList');
};

// --- AÇÕES RODAPÉ ---
document.getElementById("btnAddItem").onclick = () => {
    getListaAtiva().itens.push({ id: Date.now(), nome: "", qtd: 1, checked: false });
    render();
    const inputs = document.querySelectorAll(".input-item");
    if(inputs.length > 0) inputs[inputs.length - 1].focus();
};

document.getElementById("btnResetChecks").onclick = () => {
    if(confirm("Resetar checks desta lista?")) {
        getListaAtiva().itens.forEach(p => p.checked = false);
        salvar(); render();
    }
};

document.getElementById("btnClearAll").onclick = () => {
    if(confirm("Apagar todos os itens da lista?")) {
        getListaAtiva().itens = [];
        salvar(); render();
    }
};

document.getElementById("btnCopyList").onclick = () => {
    const lista = getListaAtiva();
    if (lista.itens.length === 0) return alert("Lista vazia!");
    const texto = lista.itens.map(p => `${p.nome}${lista.showQty ? ' x ' + p.qtd : ''}`).join('\n');
    navigator.clipboard.writeText(texto).then(() => alert("Copiado para a área de transferência!"));
};

// --- IMPORTAÇÃO ---
document.getElementById("btnOpenBulk").onclick = () => abrirModal('modalImport');
document.getElementById("btnConfirmarImport").onclick = () => {
    const texto = document.getElementById("textoListaBulk").value.trim();
    if (texto) {
        texto.split('\n').forEach(linha => {
            let nome = linha.trim();
            let qtd = 1;
            const match = nome.match(/^(.*?)\s+x\s*(\d+)$/i);
            if (match) { nome = match[1].trim(); qtd = parseInt(match[2]); }
            if (nome) getListaAtiva().itens.push({ id: Date.now() + Math.random(), nome: nome, qtd: qtd, checked: false });
        });
        salvar(); render();
    }
    fecharModal('modalImport');
    document.getElementById("textoListaBulk").value = "";
};

function reordenarItens() {
    const listaAtiva = getListaAtiva();
    const novosItens = [];
    listaDOM.querySelectorAll('.item-compra').forEach(el => {
        const id = el.getAttribute('data-id');
        const item = listaAtiva.itens.find(p => String(p.id) === String(id));
        if (item) novosItens.push(item);
    });
    listaAtiva.itens = novosItens;
    salvar();
}

function salvar() { localStorage.setItem("shopping_planetario_db", JSON.stringify(db)); }

render();