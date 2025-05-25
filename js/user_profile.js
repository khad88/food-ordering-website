// user_profile.js - Handles user profile functionality

const API_BASE_URL = 'http://127.0.0.1:8080/api';
const ORDERS_PER_PAGE = 5;

// Global variables
let currentOrderPage = 1;
let totalOrderPages = 1;

// Kiểm tra xác thực khi trang được tải
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;
    
    checkAuthentication();
    fetchUserProfile();
    fetchOrderHistory();
});

// Kiểm tra xác thực và quyền truy cập
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
        showMessage('Vui lòng đăng nhập để truy cập trang này!', 'error');
        setTimeout(() => {
            window.location.href = 'login_register.html';
        }, 1000);
        return false;
    }

    try {
        // Kiểm tra xem có phải là tài khoản user không
        const userData = JSON.parse(user);
        if (!userData.id) {
            showMessage('Bạn không có quyền truy cập trang này!', 'error');
            setTimeout(() => {
                window.location.href = 'login_register.html';
            }, 1000);
            return false;
        }
        return true;
    } catch (error) {
        console.error('Lỗi khi kiểm tra quyền truy cập:', error);
        showMessage('Có lỗi xảy ra! Vui lòng đăng nhập lại.', 'error');
        setTimeout(() => {
            window.location.href = 'login_register.html';
        }, 1000);
        return false;
    }
}

// Kiểm tra trạng thái xác thực và cập nhật UI
function checkAuthentication() {
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
            updateCartCount();
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

// Xử lý đăng xuất
function handleLogout(event) {
    event.preventDefault();
    
    // Xóa thông tin đăng nhập
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('staff');
    localStorage.removeItem('cart');
    
    // Thông báo
    showMessage('Đăng xuất thành công!', 'success');
    
    // Chuyển hướng về trang chủ
    setTimeout(() => {
        window.location.href = 'home.html';
    }, 1000);
}

// Cập nhật số lượng giỏ hàng
async function updateCartCount() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!token || !user) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/cart`, {
            headers: {
                'Accept': 'application/json',
                'x-access-token': token
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const cartCount = data.items?.length || 0;
            
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
    const toast = document.createElement('div');
    toast.className = `message-toast ${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Lấy thông tin người dùng
async function fetchUserProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/users/profile`, {
            headers: {
                'x-access-token': localStorage.getItem('token')
            }
        });

        if (!response.ok) {
            throw new Error('Không thể tải thông tin người dùng.');
        }

        const user = await response.json();
        
        // Cập nhật thông tin hiển thị
        document.getElementById('user-name').textContent = user.name;
        document.getElementById('user-email').textContent = user.email;
        document.getElementById('user-phone').textContent = user.phone;
        document.getElementById('user-address').textContent = user.address;

        // Tự động điền thông tin vào form chỉnh sửa
        document.getElementById('edit-name').value = user.name || '';
        document.getElementById('edit-phone').value = user.phone || '';
        document.getElementById('edit-address').value = user.address || '';
        
    } catch (error) {
        console.error('Lỗi khi tải thông tin người dùng:', error);
        showMessage('Không thể tải thông tin người dùng. Vui lòng thử lại.', 'error');
    }
}

// Lấy lịch sử mua hàng
async function fetchOrderHistory(page = 1) {
    try {
        const response = await fetch(`${API_BASE_URL}/orders?page=${page}&size=${ORDERS_PER_PAGE}`, {
            headers: {
                'x-access-token': localStorage.getItem('token')
            }
        });

        if (!response.ok) {
            throw new Error('Không thể tải lịch sử mua hàng.');
        }

        const data = await response.json();
        const orders = data.orders || [];
        const totalItems = data.totalItems || 0;
        totalOrderPages = Math.ceil(totalItems / ORDERS_PER_PAGE);
        currentOrderPage = page;

        const orderHistoryContainer = document.getElementById('order-history');
        const orderPagination = document.getElementById('order-pagination');

        if (orders.length === 0) {
            orderHistoryContainer.innerHTML = '<tr><td colspan="5" class="text-center">Chưa có đơn hàng nào.</td></tr>';
            if (orderPagination) orderPagination.style.display = 'none';
            return;
        }

        orderHistoryContainer.innerHTML = orders.map(order => `
            <tr>
                <td>${order.order_id}</td>
                <td>${formatDate(order.order_time)}</td>
                <td>${formatPrice(order.total_price)} VND</td>
                <td>${order.status}</td>
                <td>
                    <button class="view-order-btn" data-order-id="${order.order_id}">
                        <i class="fas fa-eye"></i> Xem
                    </button>
                </td>
            </tr>
        `).join('');

        // Thêm event listeners cho nút "Xem"
        document.querySelectorAll('.view-order-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const orderId = event.target.closest('.view-order-btn').getAttribute('data-order-id');
                viewOrderDetails(orderId);
            });
        });

        // Chỉ hiển thị phân trang nếu có nhiều hơn 1 trang
        if (totalOrderPages > 1) {
            updateOrderPagination();
            if (orderPagination) {
                orderPagination.style.display = 'flex';
            }
        } else {
            if (orderPagination) {
                orderPagination.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Lỗi khi tải lịch sử mua hàng:', error);
        showMessage('Không thể tải lịch sử mua hàng. Vui lòng thử lại.', 'error');
    }
}

// Xem chi tiết đơn hàng
// Chuyển hướng sang trang chi tiết đơn hàng
function viewOrderDetails(orderId) {
    window.location.href = `order_detail.html?id=${orderId}`;
}

// Định dạng ngày
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

// Định dạng giá
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

// Cập nhật thông tin người dùng
document.getElementById('edit-user-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = document.getElementById('edit-name').value;
    const phone = document.getElementById('edit-phone').value;
    const address = document.getElementById('edit-address').value;

    try {
        const response = await fetch(`${API_BASE_URL}/users/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': localStorage.getItem('token')
            },
            body: JSON.stringify({ name, phone, address })
        });

        if (!response.ok) {
            throw new Error('Không thể cập nhật thông tin người dùng.');
        }

        showMessage('Cập nhật thông tin thành công!', 'success');
        fetchUserProfile(); // Tải lại thông tin người dùng
    } catch (error) {
        console.error('Lỗi khi cập nhật thông tin người dùng:', error);
        showMessage('Không thể cập nhật thông tin. Vui lòng thử lại.', 'error');
    }
});

// Đổi mật khẩu
document.getElementById('change-password-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const oldPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (newPassword !== confirmPassword) {
        alert('Mật khẩu mới và xác nhận mật khẩu không khớp.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/users/password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': localStorage.getItem('token')
            },
            body: JSON.stringify({ oldPassword, newPassword })
        });

        if (!response.ok) {
            throw new Error('Không thể đổi mật khẩu.');
        }

        alert('Đổi mật khẩu thành công!');
        document.getElementById('change-password-form').reset();
    } catch (error) {
        console.error('Lỗi khi đổi mật khẩu:', error);
        alert('Không thể đổi mật khẩu. Vui lòng thử lại.');
    }
});

// Chuyển tab
document.querySelectorAll('.tab-btn').forEach((tabButton) => {
    tabButton.addEventListener('click', (event) => {
        // Xóa trạng thái "active" khỏi tất cả các tab và nội dung
        document.querySelectorAll('.tab-btn').forEach((btn) => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach((content) => content.classList.remove('active'));

        // Thêm trạng thái "active" cho tab được chọn
        const targetTab = event.target.getAttribute('data-tab');
        tabButton.classList.add('active');
        document.getElementById(targetTab).classList.add('active');
    });
});

// Cập nhật UI phân trang
function updateOrderPagination() {
    const paginationContainer = document.getElementById('order-pagination');
    if (!paginationContainer && totalOrderPages > 1) {
        // Tạo container phân trang nếu chưa có và cần thiết
        const orderHistorySection = document.querySelector('.order-history');
        orderHistorySection.insertAdjacentHTML('beforeend', `
            <div id="order-pagination" class="pagination">
                <button onclick="changeOrderPage(-1)" id="prev-order-btn" ${currentOrderPage <= 1 ? 'disabled' : ''}>
                    ‹ Trước
                </button>
                <span id="order-page-info">Trang ${currentOrderPage} / ${totalOrderPages}</span>
                <button onclick="changeOrderPage(1)" id="next-order-btn" ${currentOrderPage >= totalOrderPages ? 'disabled' : ''}>
                    Sau ›
                </button>
            </div>
        `);
    } else if (paginationContainer) {
        if (totalOrderPages > 1) {
            // Cập nhật thông tin phân trang
            document.getElementById('order-page-info').textContent = `Trang ${currentOrderPage} / ${totalOrderPages}`;
            document.getElementById('prev-order-btn').disabled = currentOrderPage <= 1;
            document.getElementById('next-order-btn').disabled = currentOrderPage >= totalOrderPages;
            paginationContainer.style.display = 'flex';
        } else {
            paginationContainer.style.display = 'none';
        }
    }
}

// Đổi trang
async function changeOrderPage(delta) {
    const newPage = currentOrderPage + delta;
    if (newPage >= 1 && newPage <= totalOrderPages) {
        await fetchOrderHistory(newPage);
        // Scroll to top of order history
        document.querySelector('.order-history').scrollIntoView({ behavior: 'smooth' });
    }
}

// Thêm vào window để có thể gọi từ HTML
window.changeOrderPage = changeOrderPage;

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