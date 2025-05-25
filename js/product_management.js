const API_BASE_URL = 'http://127.0.0.1:8080';

// Tải danh sách sản phẩm
async function fetchProducts(page = 1, size = 10) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/products?page=${page}&size=${size}`);
        const data = await response.json();
        renderProducts(data.products);
        setupPagination(data.totalPages, data.currentPage);
    } catch (error) {
        console.error('Lỗi khi tải danh sách sản phẩm:', error);
    }
}

// Hiển thị danh sách sản phẩm
function renderProducts(products) {
    const tbody = document.getElementById('products-tbody');
    tbody.innerHTML = '';

    products.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.product_id}</td>
            <td>${product.name}</td>
            <td>${product.category?.category_name || 'Không có danh mục'}</td>
            <td>${parseFloat(product.price).toLocaleString()} VND</td>
            <td>${product.is_active ? 'Kích hoạt' : 'Ẩn'}</td>
            <td><img src="${product.image_url}" alt="${product.name}" style="width: 50px; height: 50px;"></td>
            <td>${product.description || 'Không có mô tả'}</td>
            <td>
                <a href="add_product.html?product_id=${product.product_id}">
                    <button class="edit-btn">Sửa</button>
                </a>
                <button class="delete-btn" onclick="deleteProduct(${product.product_id})">Xóa</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Xóa sản phẩm
async function deleteProduct(productId) {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;

    try {
        await fetch(`${API_BASE_URL}/api/products/${productId}`, { method: 'DELETE' });
        alert('Xóa sản phẩm thành công!');
        fetchProducts();
    } catch (error) {
        console.error('Lỗi khi xóa sản phẩm:', error);
    }
}

// Tìm kiếm sản phẩm
async function searchProducts() {
    const keyword = document.getElementById('search-input').value.trim();
    if (!keyword) return fetchProducts();

    try {
        const response = await fetch(`${API_BASE_URL}/api/products/search/${keyword}`);
        const data = await response.json();
        renderProducts(data.products);
    } catch (error) {
        console.error('Lỗi khi tìm kiếm sản phẩm:', error);
    }
}

// Thiết lập phân trang
function setupPagination(totalPages, currentPage) {
    const pagination = document.getElementById('pagination-container');
    pagination.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.className = i === currentPage ? 'active' : '';
        button.onclick = () => fetchProducts(i);
        pagination.appendChild(button);
    }
}

// Tải danh sách sản phẩm khi trang được tải
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
});