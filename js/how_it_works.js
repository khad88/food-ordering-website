// Constants
const API_BASE_URL = 'http://localhost:8080/api';

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