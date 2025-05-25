const API_BASE_URL = 'http://127.0.0.1:8080';
const token = localStorage.getItem('token');

// Kiểm tra token
if (!token) {
    alert('Bạn cần đăng nhập để thực hiện thao tác này.');
    window.location.href = 'login_register.html'; // Chuyển hướng đến trang đăng nhập
}

// Lấy ID hóa đơn từ URL
const urlParams = new URLSearchParams(window.location.search);
const orderId = urlParams.get('id');

// Biến lưu trạng thái phân trang
let currentPage = 1;
const pageSize = 2; // Số sản phẩm hiển thị trên mỗi trang

// Hàm tải chi tiết hóa đơn
async function fetchOrderDetail(orderId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
            headers: {
                'x-access-token': token
            }
        });

        if (!response.ok) {
            throw new Error('Không thể tải chi tiết hóa đơn.');
        }

        const order = await response.json();
        renderOrderDetail(order);
    } catch (error) {
        console.error('Lỗi khi tải chi tiết hóa đơn:', error);
        document.getElementById('order-detail-container').innerHTML = `
            <p class="error">Không thể tải chi tiết hóa đơn. Vui lòng thử lại sau.</p>
        `;
    }
}

// Hàm hiển thị chi tiết hóa đơn
function renderOrderDetail(order) {
    const container = document.getElementById('order-detail-container');
    
    // Tính tổng tiền gốc từ các sản phẩm
    const originalTotal = order.order_details.reduce((sum, item) => 
        sum + (item.unit_price * item.quantity), 0
    );

    // Tạo phần hiển thị thông tin giảm giá
    let promotionHtml = '';
    if (order.promotion) {
        const discountAmount = originalTotal - order.total_price;
        promotionHtml = `
            <div class="promotion-info">
                <h3>Thông tin khuyến mãi</h3>
                <p><strong>Mã giảm giá:</strong> ${order.promotion.title}</p>
                <p><strong>Giảm giá:</strong> ${order.promotion.discount_percent}%</p>
                <p><strong>Số tiền giảm:</strong> ${formatPrice(discountAmount)}</p>
            </div>
        `;
    }

    container.innerHTML = `
        <div class="order-info">
            <h2>Thông tin hóa đơn</h2>
            <p><strong>Mã hóa đơn:</strong> ${order.order_id}</p>
            <p><strong>Người mua:</strong> ${order.user.name} (${order.user.email})</p>
            <p><strong>Số điện thoại:</strong> ${order.user.phone}</p>
            <p><strong>Địa chỉ:</strong> ${order.user.address}</p>
            <p><strong>Trạng thái:</strong> ${order.status}</p>
            <p><strong>Ngày đặt:</strong> ${formatDate(order.order_time)}</p>
            <div class="price-info">
                <p class="final-price"><strong>Tiền hàng gốc:</strong> ${formatPrice(originalTotal)}</p>
                ${order.promotion ? `
                    <p class="discount"><strong>Giảm giá:</strong> -${formatPrice(originalTotal - order.total_price)}</p>
                ` : ''}
                <p class="final-price"><strong>Tổng thanh toán:</strong> ${formatPrice(order.total_price)}</p>
            </div>
            ${promotionHtml}
        </div>
        <div class="order-items">
            <h2>Danh sách sản phẩm</h2>
            <ul id="product-list">
                <!-- Danh sách sản phẩm sẽ được hiển thị ở đây -->
            </ul>
            <div class="pagination" id="pagination-container">
                <!-- Nút phân trang sẽ được thêm động -->
            </div>
        </div>
        <div class="payment-info">
            <h2>Thông tin thanh toán</h2>
            ${order.payments.map(payment => `
                <p><strong>Phương thức:</strong> ${payment.method}</p>
                <p><strong>Trạng thái:</strong> ${payment.status}</p>
                <p><strong>Thời gian thanh toán:</strong> ${formatDate(payment.paid_at)}</p>
            `).join('')}
        </div>
    `;

    // Hiển thị danh sách sản phẩm với phân trang
    renderProductList(order.order_details);
}

// Hàm hiển thị danh sách sản phẩm với phân trang
function renderProductList(products) {
    const productList = document.getElementById('product-list');
    const paginationContainer = document.getElementById('pagination-container');

    // Tính toán số trang
    const totalPages = Math.ceil(products.length / pageSize);

    // Lấy danh sách sản phẩm cho trang hiện tại
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentProducts = products.slice(startIndex, endIndex);

    // Hiển thị sản phẩm
    productList.innerHTML = currentProducts.map(item => `
        <li>
            <div class="product-image-container">
                <img src="${item.product.image_url || '/images/default-food.png'}" 
                     alt="${item.product.name}" 
                     class="product-image"
                     onerror="this.onerror=null; this.src='/images/default-food.png'">
            </div>
            <div class="product-info">
                <strong>${item.product.name}</strong>
                <p>Số lượng: ${item.quantity}</p>
                <p>Đơn giá: ${formatPrice(item.unit_price)}</p>
            </div>
        </li>
    `).join('');

    // Hiển thị nút phân trang
    if (totalPages > 1) {
        paginationContainer.innerHTML = '';
        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            pageButton.className = i === currentPage ? 'active' : '';
            pageButton.addEventListener('click', () => {
                currentPage = i;
                renderProductList(products);
            });
            paginationContainer.appendChild(pageButton);
        }
    } else {
        paginationContainer.innerHTML = '';
    }
}

// Hàm định dạng ngày
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Hàm định dạng giá
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

// Hàm quay lại trang trước đó
function goBack() {
    window.history.back();
}

// Tải chi tiết hóa đơn khi trang được tải
document.addEventListener('DOMContentLoaded', () => {
    if (orderId) {
        fetchOrderDetail(orderId);
    } else {
        document.getElementById('order-detail-container').innerHTML = `
            <p class="error">Không tìm thấy mã hóa đơn.</p>
        `;
    }
});

// DOM Elements
const messageToast = document.getElementById('message-toast');
const toastMessage = document.getElementById('toast-message');

// State
let isAuthenticated = false;
let authToken = null;

// Kiểm tra xác thực khi trang tải
document.addEventListener('DOMContentLoaded', () => {
    checkAuthentication();
});

// Kiểm tra trạng thái xác thực
function checkAuthentication() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const staff = JSON.parse(localStorage.getItem('staff'));
    const loginBtn = document.querySelector('.login-btn');
    const cartCount = document.querySelector('.cart-count');
    const startBtn = document.querySelector('.primary-btn');
    const ctaBtn = document.querySelector('.cta-section .secondary-btn');

    if (token && (user || staff)) {
        // Người dùng đã đăng nhập
        isAuthenticated = true;
        authToken = token;
        const currentUser = user || staff;
        
        if (loginBtn) {
            loginBtn.innerHTML = `
                <i class="fas fa-user"></i>
                <span>${currentUser.name}</span>
            `;
            loginBtn.href = 'user_profile.html';
            loginBtn.onclick = handleLogout;
        }
        
        // Cập nhật số lượng giỏ hàng nếu có
        if (cartCount && user) {
            updateCartCount();
        }

        // Cập nhật nút CTA
        if (startBtn) {
            startBtn.href = 'menu.html';
            startBtn.textContent = 'Đặt hàng ngay';
        }

        if (ctaBtn) {
            ctaBtn.href = 'menu.html';
            ctaBtn.textContent = 'Đặt hàng ngay';
        }
    } else {
        // Chưa đăng nhập
        isAuthenticated = false;
        authToken = null;
        
        if (loginBtn) {
            loginBtn.innerHTML = `
                <i class="fas fa-user"></i>
                <span>Đăng nhập</span>
            `;
            loginBtn.href = 'login_register.html';
            loginBtn.onclick = null;
        }
        
        if (cartCount) cartCount.textContent = '0';

        // Reset nút CTA về trạng thái mặc định
        if (startBtn) {
            startBtn.href = 'login_register.html';
            startBtn.textContent = 'Bắt đầu';
        }

        if (ctaBtn) {
            ctaBtn.href = 'login_register.html';
            ctaBtn.textContent = 'Đăng nhập';
        }
    }
}

// Xử lý đăng xuất
function handleLogout(event) {
    event.preventDefault();
    
    // Xóa thông tin đăng nhập
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('staff');
    localStorage.removeItem('cart');
    
    // Cập nhật trạng thái và UI
    isAuthenticated = false;
    authToken = null;
    checkAuthentication();
    
    // Thông báo
    showMessage('Đăng xuất thành công!', 'success');
    
    // Chuyển hướng về trang chủ
    setTimeout(() => {
        window.location.href = 'home.html';
    }, 1000);
}

// Cập nhật số lượng sản phẩm trong giỏ hàng
async function updateCartCount() {
    try {
        const response = await fetch(`${API_BASE_URL}/cart`, {
            headers: {
                'Accept': 'application/json',
                'x-access-token': authToken
            }
        });

        if (response.ok) {
            const data = await response.json();
            const cartCount = data.cart?.cart_items?.length || 0;
            
            // Cập nhật UI số lượng trong giỏ hàng
            const cartCountElement = document.querySelector('.cart-count');
            if (cartCountElement) {
                cartCountElement.textContent = cartCount;
                cartCountElement.style.display = cartCount > 0 ? 'block' : 'none';
            }
        }
    } catch (error) {
        console.error('Error updating cart count:', error);
    }
}

// Hiển thị thông báo
function showMessage(message, type = 'info') {
    const toast = document.getElementById('message-toast');
    const toastMessage = document.getElementById('toast-message');
    
    if (!toast || !toastMessage) {
        // Tạo element toast nếu chưa có
        const toastHTML = `
            <div id="message-toast" class="message-toast">
                <span id="toast-message"></span>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', toastHTML);
    }
    
    // Thêm class cho kiểu thông báo
    toast.className = `message-toast ${type}`;
    toastMessage.textContent = message;
    
    // Hiển thị toast
    toast.style.display = 'block';
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    
    // Animation hiển thị
    toast.style.animation = 'slideIn 0.5s ease-out';
    
    // Tự động ẩn sau 3 giây
    setTimeout(() => {
        // Animation ẩn
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-100%)';
        toast.style.animation = 'slideOut 0.5s ease-in';
        
        setTimeout(() => {
            toast.style.display = 'none';
        }, 500);
    }, 3000);
} 