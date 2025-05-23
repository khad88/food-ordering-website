// API configuration
const API_BASE_URL = 'http://localhost:8080/api';

// Hàm fetch API chung
async function fetchAPI(endpoint, method = 'GET', body = null, requireAuth = true) {
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (requireAuth) {
        const token = localStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        } else {
            // Chuyển hướng về trang đăng nhập nếu không có token
            window.location.href = '/login_register.html';
            return;
        }
    }
    
    const options = {
        method,
        headers
    };
    
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        
        if (response.status === 401) {
            // Token hết hạn hoặc không hợp lệ
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login_register.html';
            return;
        }
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Lỗi kết nối với server');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Lỗi API:', error);
        throw error;
    }
}

// Hàm hiển thị thông báo
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}