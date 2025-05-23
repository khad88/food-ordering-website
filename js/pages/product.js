document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Lấy danh sách sản phẩm
        const products = await ProductService.getAllProducts();
        
        // Lấy danh sách danh mục để lọc
        const categories = await ProductService.getAllCategories();
        
        // Hiển thị danh sách sản phẩm
        displayProducts(products);
        
        // Hiển thị danh mục để lọc
        displayCategories(categories);
        
        // Thêm sự kiện cho nút tìm kiếm
        const searchInput = document.getElementById('search-product');
        if (searchInput) {
            searchInput.addEventListener('input', filterProducts);
        }
    } catch (error) {
        showNotification('Không thể tải danh sách sản phẩm: ' + error.message, 'error');
    }
});

// Hiển thị danh sách sản phẩm
function displayProducts(products) {
    const productContainer = document.getElementById('product-container');
    if (!productContainer) return;
    
    productContainer.innerHTML = '';
    
    if (products.length === 0) {
        productContainer.innerHTML = '<div class="empty-message">Không có sản phẩm nào.</div>';
        return;
    }
    
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.dataset.id = product.id;
        productCard.dataset.category = product.categoryId;
        productCard.dataset.name = product.name.toLowerCase();
        
        productCard.innerHTML = `
            <div class="product-image">
                <img src="${product.image || '../images/default-product.jpg'}" alt="${product.name}">
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="product-description">${product.description.substring(0, 100)}${product.description.length > 100 ? '...' : ''}</p>
                <div class="product-price">${product.price.toLocaleString('vi-VN')} đ</div>
                <div class="product-actions">
                    <button class="btn btn-add-cart" data-id="${product.id}">Thêm vào giỏ</button>
                    <button class="btn btn-view-detail" data-id="${product.id}">Chi tiết</button>
                </div>
            </div>
        `;
        
        productContainer.appendChild(productCard);
    });
    
    // Thêm sự kiện cho các nút
    document.querySelectorAll('.btn-add-cart').forEach(button => {
        button.addEventListener('click', addToCart);
    });
    
    document.querySelectorAll('.btn-view-detail').forEach(button => {
        button.addEventListener('click', viewProductDetail);
    });
}

// Hiển thị danh mục để lọc
function displayCategories(categories) {
    const categoryContainer = document.getElementById('category-filter');
    if (!categoryContainer) return;
    
    categoryContainer.innerHTML = `
        <button class="category-item active" data-category="all">Tất cả</button>
    `;
    
    categories.forEach(category => {
        const categoryButton = document.createElement('button');
        categoryButton.className = 'category-item';
        categoryButton.dataset.category = category.id;
        categoryButton.textContent = category.name;
        
        categoryContainer.appendChild(categoryButton);
    });
    
    // Thêm sự kiện lọc theo danh mục
    document.querySelectorAll('.category-item').forEach(button => {
        button.addEventListener('click', filterByCategory);
    });
}

// Lọc sản phẩm theo danh mục
function filterByCategory(e) {
    const categoryId = e.target.dataset.category;
    
    // Chuyển trạng thái active
    document.querySelectorAll('.category-item').forEach(item => {
        item.classList.remove('active');
    });
    e.target.classList.add('active');
    
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        if (categoryId === 'all' || card.dataset.category === categoryId) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Lọc sản phẩm theo từ khóa tìm kiếm
function filterProducts() {
    const searchInput = document.getElementById('search-product');
    const keyword = searchInput.value.toLowerCase().trim();
    
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        const productName = card.dataset.name;
        if (productName.includes(keyword)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Thêm sản phẩm vào giỏ hàng
async function addToCart(e) {
    e.preventDefault();
    
    // Kiểm tra đăng nhập
    if (!AuthService.isLoggedIn()) {
        showNotification('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!', 'error');
        setTimeout(() => {
            window.location.href = '/login_register.html';
        }, 2000);
        return;
    }
    
    const productId = e.target.dataset.id;
    
    try {
        // Gọi API thêm vào giỏ hàng
        await CartService.addToCart(productId, 1);
        showNotification('Đã thêm sản phẩm vào giỏ hàng!', 'success');
        
        // Cập nhật số lượng giỏ hàng hiển thị (nếu có)
        updateCartCount();
    } catch (error) {
        showNotification('Không thể thêm vào giỏ hàng: ' + error.message, 'error');
    }
}

// Xem chi tiết sản phẩm
function viewProductDetail(e) {
    const productId = e.target.dataset.id;
    window.location.href = `/product-detail.html?id=${productId}`;
}

// Cập nhật số lượng giỏ hàng hiển thị
async function updateCartCount() {
    try {
        const cart = await CartService.getCart();
        const cartCountElement = document.getElementById('cart-count');
        if (cartCountElement) {
            cartCountElement.textContent = cart.totalItems || 0;
        }
    } catch (error) {
        console.error('Không thể cập nhật số lượng giỏ hàng:', error);
    }
}