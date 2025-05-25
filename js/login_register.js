const API_BASE_URL = 'http://127.0.0.1:8080';

// Kiểm tra trạng thái đăng nhập khi trang được tải
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    updateAuthUI();
});

// Thiết lập các event listeners
function setupEventListeners() {
    // Xử lý chuyển đổi tab
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', switchTab);
    });

    // Xử lý form đăng nhập và đăng ký
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (registerForm) registerForm.addEventListener('submit', handleRegister);

    // Kiểm tra URL parameters để chuyển tab nếu cần
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab === 'register') {
        document.querySelector('[data-tab="register"]').click();
    }
}

// Cập nhật giao diện dựa trên trạng thái đăng nhập
function updateAuthUI() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const staff = JSON.parse(localStorage.getItem('staff'));
    const loginBtn = document.querySelector('.login-btn');
    const cartCount = document.querySelector('.cart-count');

    if (token && (user || staff)) {
        // Người dùng đã đăng nhập
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
            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            cartCount.textContent = cart.length;
        }
    } else {
        // Chưa đăng nhập
        if (loginBtn) {
            loginBtn.innerHTML = `
                <i class="fas fa-user"></i>
                <span>Đăng nhập</span>
            `;
            loginBtn.href = 'login_register.html';
            loginBtn.onclick = null;
        }
        if (cartCount) cartCount.textContent = '0';
    }
}

// Xử lý chuyển đổi tab
function switchTab(event) {
    const targetTab = event.target.getAttribute('data-tab');
    
    // Cập nhật trạng thái active của các tab
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Ẩn/hiện form tương ứng
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    document.getElementById(`${targetTab}-form`).classList.add('active');
}

// Xử lý đăng nhập
async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();
    const loginType = document.getElementById('login-type').value;

    try {
        const response = await fetch(`${API_BASE_URL}${loginType === 'user' ? '/api/auth/signin' : '/api/auth/staff/signin'}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Lưu thông tin đăng nhập
            localStorage.setItem('token', data.accessToken);
            localStorage.setItem(loginType, JSON.stringify(data));
            
            // Cập nhật giao diện
            updateAuthUI();
            
            // Thông báo thành công
            alert('Đăng nhập thành công!');
            
            // Chuyển hướng
            window.location.href = loginType === 'user' ? 'user_profile.html' : 'admin_dashboard.html';
        } else {
            throw new Error(data.message || 'Đăng nhập thất bại');
        }
    } catch (error) {
        console.error('Lỗi đăng nhập:', error);
        alert(error.message || 'Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại.');
    }
}

// Xử lý đăng ký
async function handleRegister(event) {
    event.preventDefault();

    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value.trim();
    const confirmPassword = document.getElementById('register-confirm-password').value.trim();
    const phone = document.getElementById('register-phone').value.trim();
    const address = document.getElementById('register-address').value.trim();

    if (password !== confirmPassword) {
        alert('Mật khẩu và nhập lại mật khẩu không khớp!');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, phone, address })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Đăng ký thành công! Vui lòng đăng nhập.');
            // Chuyển sang tab đăng nhập
            document.querySelector('[data-tab="login"]').click();
            // Reset form
            event.target.reset();
        } else {
            throw new Error(data.message || 'Đăng ký thất bại');
        }
    } catch (error) {
        console.error('Lỗi đăng ký:', error);
        alert(error.message || 'Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại.');
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
    
    // Cập nhật giao diện
    updateAuthUI();
    
    // Thông báo
    alert('Đăng xuất thành công!');
    
    // Chuyển hướng về trang chủ
    window.location.href = 'home.html';
}