let produtos = JSON.parse(localStorage.getItem("shopping_list_data")) || [];

const listaDOM = document.getElementById("listaCompras");
const btnAdd = document.getElementById("btnAddItem");
const btnReset = document.getElementById("btnReset");

// Inicializar Sortable (Arrastar)
if (listaDOM) {
    new Sortable(listaDOM, {
        animation: 150,
        handle: '.drag-handle',
        ghostClass: 'sortable-ghost',
        onEnd: () => {
            reordenarArray();
        }
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

        check.onchange = () => {
            prod.checked = check.checked;
            salvar();
            render();
        };

        inputNome.onblur = () => {
            prod.nome = inputNome.value;
            salvar();
        };

        inputNome.onkeydown = (e) => { if(e.key === "Enter") inputNome.blur(); };

        btnMinus.onclick = (e) => {
            e.preventDefault();
            if (prod.qtd > 1) {
                prod.qtd--;
                salvar();
                render();
            }
        };

        btnPlus.onclick = (e) => {
            e.preventDefault();
            prod.qtd++;
            salvar();
            render();
        };

        btnDel.onclick = () => {
            produtos = produtos.filter(p => p.id !== prod.id);
            salvar();
            render();
        };

        listaDOM.appendChild(div);
    });
}

// Eventos Globais
btnAdd.onclick = () => {
    produtos.push({ id: Date.now(), nome: "", qtd: 1, checked: false });
    render();
    const inputs = document.querySelectorAll(".input-item");
    if(inputs.length > 0) inputs[inputs.length - 1].focus();
};

btnReset.onclick = () => {
    if(confirm("Limpar marcações?")) {
        produtos.forEach(p => p.checked = false);
        salvar();
        render();
    }
};

// Modal Import
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
                if (linha.trim()) {
                    produtos.push({
                        id: Date.now() + Math.random(),
                        nome: linha.trim(),
                        qtd: 1,
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