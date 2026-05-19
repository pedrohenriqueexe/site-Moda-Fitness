// ==========================================================================
// CONFIGURAÇÃO DE CONEXÃO COM O SUPABASE
// ==========================================================================
const SUPABASE_URL = "https://zlwrajvmnxaecrjpbyun.supabase.co";
const SUPABASE_KEY = "sb_publishable_R5Lxc0gvMQj4u0EIf6a9LA_VyX3BPiT"; // <<< COLE SUA CHAVE AQUI
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Array global do carrinho de compras
let cart = [];

// Seleção de Elementos da Interface
const cartIcon = document.getElementById('cart-icon');
const cartSidebar = document.getElementById('cart-sidebar');
const closeCartBtn = document.getElementById('close-cart');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartCountElement = document.getElementById('cart-count');
const cartTotalValue = document.getElementById('cart-total-value');
const filterElements = document.querySelectorAll('[data-filter]');
const sectionTitle = document.getElementById('section-title');
const searchInput = document.getElementById('search-input');
const backToTopBtn = document.getElementById('back-to-top');

// Elemento da Grid que vai receber os produtos do Banco de Dados
const productGrid = document.querySelector('.product-grid');

// ==========================================================================
// 1. BUSCAR PRODUTOS DO BANCO DE DADOS (SUPABASE)
// ==========================================================================
async function carregarProdutosDoBanco() {
    try {
        // Busca todos os dados da tabela 'produtos' no Supabase
        const { data: produtos, error } = await _supabase
            .from('produtos')
            .select('*');

        if (error) throw error;

        // Se o banco estiver vazio, avisa na tela
        if (!produtos || produtos.length === 0) {
            productGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #666; font-style: italic;">Nenhum produto cadastrado no banco de dados ainda.</p>`;
            return;
        }

        // Limpa os produtos estáticos do HTML para colocar os do Banco
        productGrid.innerHTML = '';

        // Renderiza cada produto vindo do PostgreSQL
        produtos.forEach(produto => {
            const temDesconto = produto.old_price ? true : false;
            
            const cardHtml = `
                <div class="product-card" data-category="${produto.category}">
                    <div class="product-image">
                        ${temDesconto ? `<span class="tag-promo">PROMO</span>` : ''}
                        <img src="${produto.image_url}" alt="${produto.name}">
                    </div>
                    <div class="product-info">
                        <h3>${produto.name}</h3>
                        
                        <div class="size-selector">
                            <span>Tam:</span>
                            <button class="size-btn active">${produto.category === 'acessorios' ? 'U' : 'M'}</button>
                            ${produto.category !== 'acessorios' ? `
                                <button class="size-btn">P</button>
                                <button class="size-btn">G</button>
                                <button class="size-btn">GG</button>
                            ` : ''}
                        </div>

                        <p class="price" data-price="${produto.price}">
                            ${temDesconto ? `<span class="old-price">R$ ${produto.old_price.toFixed(2).replace('.', ',')}</span>` : ''}
                            R$ ${produto.price.toFixed(2).replace('.', ',')}
                        </p>
                        <button class="btn-add" onclick="adicionarItemAoCarrinho('${produto.name}', ${produto.price}, this)">Adicionar ao Carrinho</button>
                    </div>
                </div>
            `;
            productGrid.innerHTML += cardHtml;
        });

        // Reconfigura os eventos de tamanho para os novos botões criados dinamicamente
        configurarBotoesDeTamanho();

    } catch (err) {
        console.error("Erro ao puxar dados do Supabase:", err.message);
        productGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #ff3333;">Erro ao carregar produtos do banco de dados.</p>`;
    }
}

// Executa a busca assim que a página termina de carregar
document.addEventListener('DOMContentLoaded', carregarProdutosDoBanco);

// ==========================================================================
// 2. GERENCIAMENTO DA SIDEBAR DO CARRINHO (ABRIR / FECHAR)
// ==========================================================================
cartIcon.addEventListener('click', (e) => {
    e.preventDefault();
    cartSidebar.classList.add('open');
});

closeCartBtn.addEventListener('click', () => {
    cartSidebar.classList.remove('open');
});

// ==========================================================================
// 3. FILTRAGEM DINÂMICA POR CATEGORIAS
// ==========================================================================
filterElements.forEach(element => {
    element.addEventListener('click', (e) => {
        e.preventDefault();
        const filterValue = element.getAttribute('data-filter');

        document.querySelectorAll('.nav-links a').forEach(link => link.classList.remove('active'));
        if(element.tagName === 'A') element.classList.add('active');

        if(filterValue === 'all') sectionTitle.innerText = "Todos os Produtos";
        else if(filterValue === 'feminino') sectionTitle.innerText = "Moda Feminina";
        else if(filterValue === 'masculino') sectionTitle.innerText = "Moda Masculina";
        else if(filterValue === 'acessorios') sectionTitle.innerText = "Acessórios";

        const cards = document.querySelectorAll('.product-card');
        cards.forEach(card => {
            const cardCategory = card.getAttribute('data-category');
            if (filterValue === 'all' || filterValue === cardCategory) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
        sectionTitle.scrollIntoView({ behavior: 'smooth' });
    });
});

// ==========================================================================
// 4. CONFIGURAÇÃO DOS SELETORES DE TAMANHO
// ==========================================================================
function configurarBotoesDeTamanho() {
    document.querySelectorAll('.size-selector').forEach(selector => {
        const sizeButtons = selector.querySelectorAll('.size-btn');
        sizeButtons.forEach(btn => {
            btn.replaceWith(btn.cloneNode(true)); // Limpa eventos antigos
        });
        
        const novosBotoes = selector.querySelectorAll('.size-btn');
        novosBotoes.forEach(btn => {
            btn.addEventListener('click', () => {
                novosBotoes.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    });
}

// ==========================================================================
// 5. BARRA DE PESQUISA EM TEMPO REAL
// ==========================================================================
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();
    sectionTitle.innerText = searchTerm !== "" ? `Resultados para: "${searchTerm}"` : "Todos os Produtos";

    const cards = document.querySelectorAll('.product-card');
    cards.forEach(card => {
        const productName = card.querySelector('h3').innerText.toLowerCase();
        if (productName.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
});

// ==========================================================================
// 6. GERENCIAMENTO COMPLETO DO CARRINHO
// ==========================================================================
function updateCart() {
    cartCountElement.innerText = cart.length;
    cartItemsContainer.innerHTML = '';

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart-msg">Seu carrinho está vazio.</p>';
        cartTotalValue.innerText = "R$ 0,00";
        return;
    }

    let total = 0;

    cart.forEach((item, index) => {
        total += item.price;
        
        const itemHtml = `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>Tam: ${item.size}</p>
                    <span>R$ ${item.price.toFixed(2).replace('.', ',')}</span>
                </div>
                <button class="btn-remove-item" onclick="removeFromCart(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        cartItemsContainer.innerHTML += itemHtml;
    });

    cartTotalValue.innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

window.adicionarItemAoCarrinho = function(nome, preco, botao) {
    const productCard = botao.closest('.product-card');
    const activeSizeButton = productCard.querySelector('.size-btn.active');
    const selectedSize = activeSizeButton ? activeSizeButton.innerText : 'M';

    const productItem = {
        name: nome,
        price: preco,
        size: selectedSize
    };

    cart.push(productItem);
    updateCart();
    showToast(`${nome} (${selectedSize}) adicionado!`);
};

window.removeFromCart = function(index) {
    cart.splice(index, 1);
    updateCart();
};

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3000);
}

// ==========================================================================
// 7. LÓGICA DO BOTÃO VOLTAR AO TOPO
// ==========================================================================
window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
        backToTopBtn.classList.add('show');
    } else {
        backToTopBtn.classList.remove('show');
    }
});

backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});