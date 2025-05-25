const API_BASE_URL = 'http://127.0.0.1:8080';
const token = localStorage.getItem('token');

// Kiểm tra token
if (!token) {
    alert('Bạn cần đăng nhập để thực hiện thao tác này.');
    window.location.href = 'login_register.html'; // Chuyển hướng đến trang đăng nhập
}

let currentPage = 1;
const pageSize = 5; // Cố định 5 đơn hàng/trang
let currentFilter = 'all';
let allOrders = []; // Lưu trữ tất cả đơn hàng
let currentOrders = []; // Lưu trữ đơn hàng đang hiển thị
let currentOrderIndex = -1;

let currentProductPage = 1;
const productsPerPage = 2;
let currentOrderDetails = null;
let totalPages = 1;

// Tải danh sách đơn hàng
async function fetchOrders() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/orders`, {
            headers: {
                'x-access-token': token
            }
        });

        if (!response.ok) {
            throw new Error('Không thể tải danh sách đơn hàng.');
        }

        const data = await response.json();
        allOrders = data.orders; // Lưu trữ tất cả đơn hàng
        filterAndDisplayOrders();
    } catch (error) {
        console.error('Lỗi khi tải danh sách đơn hàng:', error);
        showError('Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.');
    }
}

// Lọc và hiển thị đơn hàng theo trang
function filterAndDisplayOrders(page = currentPage) {
    currentPage = page;
    let filteredOrders = allOrders;

    // Áp dụng bộ lọc nếu không phải 'all'
    if (currentFilter !== 'all') {
        filteredOrders = allOrders.filter(order => order.status === currentFilter);
    }

    // Sắp xếp đơn hàng theo trạng thái và thời gian
    const statusOrder = {
        'Chờ xác nhận': 1,
        'Đang giao': 2,
        'Đã giao': 3,
        'Đã hủy': 4
    };

    filteredOrders.sort((a, b) => {
        const statusComparison = statusOrder[a.status] - statusOrder[b.status];
        if (statusComparison === 0) {
            return new Date(b.order_time) - new Date(a.order_time);
        }
        return statusComparison;
    });

    // Tính toán phân trang
    const totalPages = Math.ceil(filteredOrders.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const ordersToShow = filteredOrders.slice(startIndex, endIndex);

    // Hiển thị đơn hàng và phân trang
    renderOrders(ordersToShow);
    setupPagination(totalPages, currentPage, filteredOrders.length);
}

// Hiển thị phân trang
function setupPagination(totalPages, currentPage, totalItems) {
    const paginationContainer = document.getElementById('pagination-container');
    paginationContainer.innerHTML = '';

    if (totalPages <= 1) return;

    const paginationWrapper = document.createElement('div');
    paginationWrapper.className = 'pagination-wrapper';

    // Thêm thông tin trang
    const pageInfo = document.createElement('div');
    pageInfo.className = 'pagination-info';
    pageInfo.textContent = `Trang ${currentPage}/${totalPages} (${totalItems} đơn hàng)`;
    paginationWrapper.appendChild(pageInfo);

    // Container cho các nút phân trang
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'pagination-buttons';

    // Nút Previous
    const prevButton = document.createElement('button');
    prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevButton.disabled = currentPage === 1;
    prevButton.onclick = () => {
        if (currentPage > 1) {
            filterAndDisplayOrders(currentPage - 1);
        }
    };
    buttonsContainer.appendChild(prevButton);

    // Các nút số trang
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.className = i === currentPage ? 'active' : '';
        pageButton.onclick = () => filterAndDisplayOrders(i);
        buttonsContainer.appendChild(pageButton);
    }

    // Nút Next
    const nextButton = document.createElement('button');
    nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextButton.disabled = currentPage === totalPages;
    nextButton.onclick = () => {
        if (currentPage < totalPages) {
            filterAndDisplayOrders(currentPage + 1);
        }
    };
    buttonsContainer.appendChild(nextButton);

    paginationWrapper.appendChild(buttonsContainer);
    paginationContainer.appendChild(paginationWrapper);
}

// Xử lý sự kiện click nút lọc
function handleFilterClick(status) {
    currentFilter = status;
    currentPage = 1; // Reset về trang đầu khi thay đổi filter
    filterAndDisplayOrders(1);

    // Cập nhật trạng thái active của các nút
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.status === status);
    });
}

function renderOrders(orders) {
    currentOrders = orders; // Lưu danh sách đơn hàng hiện tại
    const tbody = document.getElementById('orders-tbody');
    tbody.innerHTML = '';

    if (orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="no-orders">Không có đơn hàng nào${currentFilter !== 'all' ? ` với trạng thái "${currentFilter}"` : ''}</td>
            </tr>
        `;
        return;
    }

    orders.forEach(order => {
        const row = document.createElement('tr');
        row.onclick = () => viewOrderDetails(order.order_id);
        
        row.className = `order-row status-${order.status.toLowerCase().replace(/\s+/g, '-')}`;
        
        row.innerHTML = `
            <td>${order.order_id}</td>
            <td>${order.user.name}</td>
            <td>${order.order_details.map(detail => detail.product.name).join(', ')}</td>
            <td>${order.order_details.map(detail => detail.quantity).join(', ')}</td>
            <td>${formatPrice(order.total_price)}</td>
            <td class="order-status ${order.status.toLowerCase().replace(/\s+/g, '-')}">${order.status}</td>
            <td>${formatDateTime(order.order_time)}</td>
            <td>
                ${getActionButtons(order)}
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Định dạng giá tiền
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

// Định dạng thời gian
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

// Xem chi tiết đơn hàng
async function viewOrderDetails(orderId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
            headers: {
                'x-access-token': token
            }
        });

        if (!response.ok) {
            throw new Error('Không thể tải chi tiết đơn hàng.');
        }

        const order = await response.json();
        
        // Cập nhật index của đơn hàng hiện tại
        currentOrderIndex = currentOrders.findIndex(o => o.order_id === orderId);
        
        renderOrderDetails(order);
        updateModalNavigation();
        showModal();
    } catch (error) {
        console.error('Lỗi khi tải chi tiết đơn hàng:', error);
        alert('Không thể tải chi tiết đơn hàng. Vui lòng thử lại sau.');
    }
}

function renderOrderDetails(order) {
    currentOrderDetails = order; // Lưu lại thông tin đơn hàng hiện tại
    currentProductPage = 1; // Reset về trang đầu khi mở modal mới

    // Cập nhật ID đơn hàng
    document.getElementById('modal-order-id').textContent = order.order_id;

    // Cập nhật thông tin khách hàng
    document.getElementById('customer-name').textContent = order.user.name;
    document.getElementById('customer-email').textContent = order.user.email;
    document.getElementById('customer-phone').textContent = order.user.phone || 'Không có';
    document.getElementById('customer-address').textContent = order.user.address || 'Không có';

    // Cập nhật thông tin đơn hàng
    const statusElement = document.getElementById('order-status');
    statusElement.textContent = order.status;
    statusElement.className = `status-badge ${getStatusClass(order.status)}`;
    
    document.getElementById('order-time').textContent = formatDateTime(order.order_time);
    document.getElementById('payment-method').textContent = order.payments[0]?.method || 'Không có thông tin';
    document.getElementById('payment-status').textContent = order.payments[0]?.status || 'Không có thông tin';

    // Render sản phẩm với phân trang
    renderProductsWithPagination();
}

function renderProductsWithPagination() {
    if (!currentOrderDetails) return;

    const products = currentOrderDetails.order_details;
    const totalPages = Math.ceil(products.length / productsPerPage);
    
    // Tính toán sản phẩm cho trang hiện tại
    const startIndex = (currentProductPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const currentPageProducts = products.slice(startIndex, endIndex);

    // Cập nhật bảng sản phẩm
    const productsList = document.getElementById('products-list');
    productsList.innerHTML = currentPageProducts.map(detail => `
        <tr>
            <td>${detail.product.name}</td>
            <td>${formatPrice(detail.unit_price)}</td>
            <td>${detail.quantity}</td>
            <td>${formatPrice(detail.unit_price * detail.quantity)}</td>
        </tr>
    `).join('');

    // Cập nhật tổng tiền
    document.getElementById('total-price').textContent = formatPrice(currentOrderDetails.total_price);

    // Render phân trang cho sản phẩm
    renderProductPagination(totalPages);
}

function renderProductPagination(totalPages) {
    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'products-pagination';
    
    // Thêm thông tin trang
    const pageInfo = document.createElement('div');
    pageInfo.className = 'page-info';
    pageInfo.textContent = `Trang ${currentProductPage} / ${totalPages}`;
    paginationContainer.appendChild(pageInfo);

    // Container cho các nút
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'pagination-buttons';

    // Nút Previous
    const prevButton = document.createElement('button');
    prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevButton.className = 'nav-button';
    prevButton.disabled = currentProductPage === 1;
    prevButton.onclick = () => {
        if (currentProductPage > 1) {
            currentProductPage--;
            renderProductsWithPagination();
        }
    };
    buttonsContainer.appendChild(prevButton);

    // Nút Next
    const nextButton = document.createElement('button');
    nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextButton.className = 'nav-button';
    nextButton.disabled = currentProductPage >= totalPages;
    nextButton.onclick = () => {
        if (currentProductPage < totalPages) {
            currentProductPage++;
            renderProductsWithPagination();
        }
    };
    buttonsContainer.appendChild(nextButton);

    paginationContainer.appendChild(buttonsContainer);

    // Thêm phân trang vào sau bảng sản phẩm
    const productsTable = document.querySelector('.products-table');
    // Xóa phân trang cũ nếu có
    const oldPagination = document.querySelector('.products-pagination');
    if (oldPagination) {
        oldPagination.remove();
    }
    productsTable.after(paginationContainer);
}

function updateModalNavigation() {
    const prevButton = document.getElementById('prev-order');
    const nextButton = document.getElementById('next-order');

    prevButton.disabled = currentOrderIndex <= 0;
    nextButton.disabled = currentOrderIndex >= currentOrders.length - 1;

    prevButton.onclick = () => {
        if (currentOrderIndex > 0) {
            viewOrderDetails(currentOrders[currentOrderIndex - 1].order_id);
        }
    };

    nextButton.onclick = () => {
        if (currentOrderIndex < currentOrders.length - 1) {
            viewOrderDetails(currentOrders[currentOrderIndex + 1].order_id);
        }
    };
}

function showModal() {
    const modal = document.getElementById('order-details-modal');
    modal.style.display = 'block';
}

function closeOrderDetailsModal() {
    const modal = document.getElementById('order-details-modal');
    modal.style.display = 'none';
}

function getStatusClass(status) {
    const statusMap = {
        'Chờ xác nhận': 'pending',
        'Đang giao': 'delivering',
        'Đã giao': 'delivered',
        'Đã hủy': 'cancelled'
    };
    return statusMap[status] || 'pending';
}

// Lấy các nút hành động dựa trên trạng thái đơn hàng
function getActionButtons(order) {
    switch (order.status) {
        case 'Chờ xác nhận':
            return `
                <button class="edit-btn" onclick="updateOrderStatus(${order.order_id}, 'Đang giao')">Xác nhận</button>
                <button class="delete-btn" onclick="cancelOrder(${order.order_id})">Hủy</button>
            `;
        case 'Đang giao':
            return `
                <button class="edit-btn" onclick="updateOrderStatus(${order.order_id}, 'Đã giao')">Đã giao</button>
            `;
        case 'Đã giao':
        case 'Đã hủy':
            return `<span>Không có hành động</span>`;
        default:
            return `<span>Không xác định</span>`;
    }
}

// Cập nhật trạng thái đơn hàng
async function updateOrderStatus(orderId, status) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': token
            },
            body: JSON.stringify({ status })
        });

        if (response.ok) {
            alert(`Cập nhật trạng thái đơn hàng thành công! Trạng thái mới: ${status}`);
            fetchOrders(); // Tải lại danh sách đơn hàng
        } else {
            const error = await response.json();
            alert(error.message || 'Lỗi khi cập nhật trạng thái đơn hàng.');
        }
    } catch (error) {
        console.error('Lỗi khi cập nhật trạng thái đơn hàng:', error);
    }
}

// Hủy đơn hàng
async function cancelOrder(orderId) {
    if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/cancel`, {
            method: 'PUT',
            headers: {
                'x-access-token': token
            }
        });

        if (response.ok) {
            alert('Đơn hàng đã được hủy thành công!');
            fetchOrders(); // Tải lại danh sách đơn hàng
        } else {
            const error = await response.json();
            alert(error.message || 'Lỗi khi hủy đơn hàng.');
        }
    } catch (error) {
        console.error('Lỗi khi hủy đơn hàng:', error);
    }
}

// Đăng xuất
function logout() {
    localStorage.removeItem('token');
    alert('Đăng xuất thành công!');
    window.location.href = 'login_register.html'; // Chuyển hướng đến trang đăng nhập
}

// Hiển thị thông báo lỗi
function showError(message) {
    alert(message);
}

// Khởi tạo sự kiện cho các nút lọc
document.addEventListener('DOMContentLoaded', () => {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => handleFilterClick(btn.dataset.status));
    });
    fetchOrders();
});

// Thêm sự kiện đóng modal khi click bên ngoài
window.onclick = function(event) {
    const modal = document.getElementById('order-details-modal');
    if (event.target === modal) {
        closeOrderDetailsModal();
    }
}