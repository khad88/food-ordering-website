const API_BASE_URL = 'http://127.0.0.1:8080';

// Kiểm tra xác thực và quyền truy cập quản trị
async function checkAdminAuth() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        alert('Vui lòng đăng nhập để truy cập trang này!');
        window.location.href = 'login_register.html';
        return false;
    }

    try {
        // Giải mã token để kiểm tra loại người dùng
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        
        // Nếu là user thông thường, không cho phép truy cập
        if (tokenData.type === 'user') {
            alert('Bạn không có quyền truy cập trang quản trị!');
            window.location.href = 'home.html';
            return false;
        }

        // Gọi API để kiểm tra quyền manager
        const response = await fetch(`${API_BASE_URL}/api/dashboard/summary`, {
            headers: {
                'x-access-token': token
            }
        });

        if (response.status === 403) {
            // Nếu không có quyền manager, kiểm tra xem có phải employee không
            const staffResponse = await fetch(`${API_BASE_URL}/api/orders`, {
                headers: {
                    'x-access-token': token
                }
            });

            if (staffResponse.ok) {
                // Nếu là employee, chuyển hướng sang trang product management
                window.location.href = 'product_management.html';
            } else {
                // Nếu không phải employee, chuyển về trang chủ
                alert('Bạn không có quyền truy cập trang quản trị!');
                window.location.href = 'home.html';
            }
            return false;
        }

        if (!response.ok) {
            throw new Error('Không thể xác thực quyền truy cập');
        }

        return true;

    } catch (error) {
        console.error('Lỗi khi kiểm tra quyền truy cập:', error);
        localStorage.removeItem('token');
        alert('Phiên làm việc đã hết hạn! Vui lòng đăng nhập lại.');
        window.location.href = 'login_register.html';
        return false;
    }
}

// Kiểm tra xác thực khi trang được tải
document.addEventListener('DOMContentLoaded', async () => {
    if (!await checkAdminAuth()) return;
    
    // Load summary data by default
    fetchSummary();

    // Add click event listeners to all toggle buttons
    document.querySelectorAll('.toggle-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = button.getAttribute('data-target');
            toggleSection(targetId);
        });
    });
});

// Đăng xuất
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    alert('Đăng xuất thành công!');
    window.location.href = 'login_register.html';
}

// Track loaded sections
const loadedSections = {
    statistics: false,
    topProducts: false,
    orderStatus: false
};

// Fetch summary data (always loaded by default)
async function fetchSummary() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/dashboard/summary`, {
            headers: { 'x-access-token': token }
        });

        if (!response.ok) throw new Error('Không thể tải dữ liệu tổng quan.');

        const data = await response.json();

        document.getElementById('total-orders').textContent = data.totalOrders;
        document.getElementById('total-revenue').textContent = `${parseFloat(data.totalRevenue).toLocaleString()} VND`;
        document.getElementById('total-users').textContent = data.totalUsers;
        document.getElementById('orders-today').textContent = data.ordersToday;
        document.getElementById('revenue-today').textContent = `${parseFloat(data.revenueToday).toLocaleString()} VND`;
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu tổng quan:', error);
        showError('total-orders', 'Lỗi tải dữ liệu');
    }
}

// Revenue Charts
async function loadStatistics() {
    if (loadedSections.statistics) return;

    try {
        showLoading('statistics-content');
        await Promise.all([fetchDailyRevenue(), fetchMonthlyRevenue()]);
        loadedSections.statistics = true;
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu thống kê:', error);
        showError('statistics-content', 'Không thể tải biểu đồ doanh thu');
    } finally {
        hideLoading('statistics-content');
    }
}

async function fetchDailyRevenue() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/dashboard/revenue/daily`, {
        headers: { 'x-access-token': token }
    });

    if (!response.ok) throw new Error('Không thể tải dữ liệu doanh thu theo ngày.');

    const data = await response.json();
    const labels = data.map(item => item.date);
    const revenues = data.map(item => item.revenue);

    renderChart('dailyRevenueChart', 'Doanh thu theo ngày', labels, revenues);
}

async function fetchMonthlyRevenue() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/dashboard/revenue/monthly`, {
        headers: { 'x-access-token': token }
    });

    if (!response.ok) throw new Error('Không thể tải dữ liệu doanh thu theo tháng.');

    const data = await response.json();
    const labels = data.map(item => item.month);
    const revenues = data.map(item => item.revenue);

    renderChart('monthlyRevenueChart', 'Doanh thu theo tháng', labels, revenues);
}

// Top Products
async function loadTopProducts() {
    if (loadedSections.topProducts) return;

    try {
        showLoading('top-products-content');
        const response = await fetch(`${API_BASE_URL}/api/dashboard/products/top?limit=5`, {
            headers: { 'x-access-token': localStorage.getItem('token') }
        });

        if (!response.ok) throw new Error('Không thể tải top sản phẩm bán chạy.');

        const data = await response.json();
        const list = document.getElementById('top-products-list');
        
        if (!data || data.length === 0) {
            showEmptyState('top-products-list', 'Chưa có dữ liệu sản phẩm');
        } else {
            // Ensure we only take the top 5 products
            const topProducts = data.slice(0, 5);
            list.innerHTML = topProducts.map((product, index) => `
                <li class="product-item">
                    <div class="product-rank">#${index + 1}</div>
                    <div class="product-info">
                        <div class="product-details">
                            <h3 class="product-name">${product.product.name}</h3>
                            <div class="product-stats">
                                <span class="product-quantity">
                                    <i class="fas fa-box"></i>
                                    ${product.total_quantity} đã bán
                                </span>
                                <span class="product-revenue">
                                    <i class="fas fa-coins"></i>
                                    ${parseFloat(product.total_revenue).toLocaleString()} VND
                                </span>
                            </div>
                        </div>
                    </div>
                </li>
            `).join('');
        }

        loadedSections.topProducts = true;
    } catch (error) {
        console.error('Lỗi khi tải top sản phẩm bán chạy:', error);
        showError('top-products-list', 'Không thể tải dữ liệu sản phẩm');
    } finally {
        hideLoading('top-products-content');
    }
}

// Order Status
async function loadOrderStatus() {
    if (loadedSections.orderStatus) return;

    try {
        showLoading('order-status-content');
        const response = await fetch(`${API_BASE_URL}/api/dashboard/orders/status`, {
            headers: { 'x-access-token': localStorage.getItem('token') }
        });

        if (!response.ok) throw new Error('Không thể tải thống kê đơn hàng theo trạng thái.');

        const data = await response.json();
        const list = document.getElementById('order-status-list');

        if (data.length === 0) {
            showEmptyState('order-status-list', 'Chưa có dữ liệu đơn hàng');
        } else {
            list.innerHTML = data.map(status => `
                <li>
                    <div class="status-info">
                        <span class="status-name">${status.status}</span>
                        <span class="status-value">Số lượng: ${status.count}</span>
                    </div>
                </li>
            `).join('');
        }

        loadedSections.orderStatus = true;
    } catch (error) {
        console.error('Lỗi khi tải thống kê đơn hàng theo trạng thái:', error);
        showError('order-status-list', 'Không thể tải dữ liệu trạng thái đơn hàng');
    } finally {
        hideLoading('order-status-content');
    }
}

// Utility functions
function renderChart(canvasId, label, labels, data) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                backgroundColor: 'rgba(255, 203, 69, 0.2)',
                borderColor: 'rgba(255, 203, 69, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function showLoading(containerId) {
    const container = document.getElementById(containerId);
    const spinner = container.querySelector('.loading-spinner');
    if (spinner) {
        spinner.classList.remove('hidden');
    }
}

function hideLoading(containerId) {
    const container = document.getElementById(containerId);
    const spinner = container.querySelector('.loading-spinner');
    if (spinner) {
        spinner.classList.add('hidden');
    }
}

function showError(containerId, message) {
    const container = document.getElementById(containerId);
    container.innerHTML = `<div class="error-message">${message}</div>`;
}

function showEmptyState(containerId, message) {
    const container = document.getElementById(containerId);
    container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-inbox"></i>
            <p>${message}</p>
        </div>
    `;
}

// Toggle section visibility
function toggleSection(targetId) {
    const content = document.getElementById(targetId);
    const button = document.querySelector(`[data-target="${targetId}"]`);
    const isHidden = content.classList.contains('hidden');

    content.classList.toggle('hidden');
    button.classList.toggle('active');

    // Load data if section is being shown
    if (isHidden) {
        switch (targetId) {
            case 'statistics-content':
                loadStatistics();
                break;
            case 'top-products-content':
                loadTopProducts();
                break;
            case 'order-status-content':
                loadOrderStatus();
                break;
        }
    }
}

// Đăng xuất
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    alert('Đăng xuất thành công!');
    window.location.href = 'login_register.html';
}
