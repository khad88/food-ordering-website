const API_BASE_URL = 'http://127.0.0.1:8080';

// Lấy `product_id` từ URL
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('product_id');

// Lấy token từ localStorage
const token = localStorage.getItem('token');

// Kiểm tra token
if (!token) {
    alert('Bạn cần đăng nhập để thực hiện thao tác này.');
    window.location.href = 'login_register.html'; // Chuyển hướng đến trang đăng nhập
}

// Tải danh mục từ backend
async function fetchCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/categories`, {
            headers: {
                'x-access-token': token // Sử dụng x-access-token thay vì Authorization
            }
        });
        if (!response.ok) {
            throw new Error('Không thể tải danh mục.');
        }
        const categories = await response.json();
        const categorySelect = document.getElementById('category');
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.category_id;
            option.textContent = category.category_name;
            categorySelect.appendChild(option);
        });
    } catch (error) {
        console.error('Lỗi khi tải danh mục:', error);
    }
}

// Tải thông tin sản phẩm nếu đang ở chế độ sửa
async function fetchProductDetails(productId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
            headers: {
                'x-access-token': token // Sử dụng x-access-token thay vì Authorization
            }
        });
        if (!response.ok) {
            throw new Error('Không thể tải thông tin sản phẩm.');
        }

        const data = await response.json();
        const product = data.product;

        // Điền thông tin sản phẩm vào form
        document.getElementById('product-name').value = product.name;
        document.getElementById('category').value = product.category_id;
        document.getElementById('price').value = product.price;
        document.getElementById('is-active').value = product.is_active.toString();
        document.getElementById('image-url').value = product.image_url;
        document.getElementById('description').value = product.description;

        // Cập nhật tiêu đề form
        document.getElementById('form-title').textContent = 'Sửa Sản phẩm';
    } catch (error) {
        console.error('Lỗi khi tải thông tin sản phẩm:', error);
    }
}

// Thêm hoặc cập nhật sản phẩm
async function saveProduct(event) {
    event.preventDefault();

    const formData = new FormData(document.getElementById('add-product-form'));
    const product = Object.fromEntries(formData.entries());
    product.is_active = product.is_active === 'true'; // Chuyển giá trị thành boolean

    try {
        const method = productId ? 'PUT' : 'POST';
        const url = productId
            ? `${API_BASE_URL}/api/products/${productId}`
            : `${API_BASE_URL}/api/products`;

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': token // Sử dụng x-access-token thay vì Authorization
            },
            body: JSON.stringify(product)
        });

        if (response.ok) {
            alert(productId ? 'Cập nhật sản phẩm thành công!' : 'Thêm sản phẩm thành công!');
            window.location.href = 'product_management.html';
        } else if (response.status === 403) {
            alert('Bạn không có quyền thực hiện thao tác này. Vui lòng đăng nhập lại.');
            window.location.href = 'login_register.html'; // Chuyển hướng đến trang đăng nhập
        } else {
            alert('Lỗi khi lưu sản phẩm.');
        }
    } catch (error) {
        console.error('Lỗi khi lưu sản phẩm:', error);
    }
}

// Tải danh mục và thông tin sản phẩm khi trang được tải
document.addEventListener('DOMContentLoaded', () => {
    fetchCategories();
    if (productId) {
        fetchProductDetails(productId);
    }
    document.getElementById('add-product-form').addEventListener('submit', saveProduct);
});