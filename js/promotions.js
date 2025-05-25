const API_BASE_URL = 'http://127.0.0.1:8080';
const token = localStorage.getItem('token');

// Kiểm tra token
if (!token) {
    alert('Bạn cần đăng nhập để thực hiện thao tác này.');
    window.location.href = 'login_register.html'; // Chuyển hướng đến trang đăng nhập
}

let currentPage = 1; // Trang hiện tại
const pageSize = 3; // Số lượng khuyến mãi trên mỗi trang

// Lấy danh sách khuyến mãi
async function fetchPromotions(page = 1) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/promotions?page=${page}&limit=${pageSize}`, {
            headers: {
                'x-access-token': token
            }
        });

        if (!response.ok) {
            throw new Error('Không thể tải danh sách khuyến mãi.');
        }

        const data = await response.json();

        // Kiểm tra nếu không có khuyến mãi nào
        if (!data.promotions || data.promotions.length === 0) {
            document.getElementById('promotions-tbody').innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center;">Không có khuyến mãi nào.</td>
                </tr>
            `;
            document.getElementById('pagination-container').innerHTML = ''; // Xóa phân trang nếu không có dữ liệu
            return;
        }

        renderPromotions(data.promotions);
        setupPagination(data.totalPages, data.currentPage);
    } catch (error) {
        console.error('Lỗi khi tải danh sách khuyến mãi:', error);
        alert('Không thể tải danh sách khuyến mãi. Vui lòng thử lại sau.');
    }
}

function setupPagination(totalPages, currentPage) {
    const paginationContainer = document.getElementById('pagination-container');
    paginationContainer.innerHTML = ''; // Xóa nội dung cũ

    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.className = i === currentPage ? 'active' : '';
        button.onclick = () => fetchPromotions(i); // Tải dữ liệu của trang được chọn
        paginationContainer.appendChild(button);
    }
}

function renderPromotions(promotions) {
    const tbody = document.getElementById('promotions-tbody');
    tbody.innerHTML = '';

    promotions.forEach(promotion => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${promotion.promotion_id || 'Không xác định'}</td>
            <td>${promotion.title || 'Không có tiêu đề'}</td>
            <td>
                ${promotion.start_date ? new Date(promotion.start_date).toLocaleDateString() : 'Không xác định'} - 
                ${promotion.end_date ? new Date(promotion.end_date).toLocaleDateString() : 'Không xác định'}
            </td>
            <td>${promotion.description || 'Không có điều kiện'}</td>
            <td>${promotion.discount_percent ? promotion.discount_percent + '%' : 'Không xác định'}</td>
            <td>${promotion.is_active ? 'Hoạt động' : 'Không hoạt động'}</td>
            <td>
                <button class="edit-btn" onclick="window.location.href='add_promotions.html?id=${promotion.promotion_id}'">Sửa</button>
                <button class="delete-btn" onclick="deletePromotion(${promotion.promotion_id})">Xóa</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}
async function addPromotion(promotion) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/promotions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': token
            },
            body: JSON.stringify(promotion)
        });

        if (!response.ok) {
            throw new Error('Không thể thêm khuyến mãi.');
        }

        alert('Thêm khuyến mãi thành công!');
        fetchPromotions(); // Tải lại danh sách khuyến mãi
    } catch (error) {
        console.error('Lỗi khi thêm khuyến mãi:', error);
        alert('Không thể thêm khuyến mãi. Vui lòng thử lại sau.');
    }
}
async function updatePromotion(promotionId, updatedData) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/promotions/${promotionId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': token
            },
            body: JSON.stringify(updatedData)
        });

        if (!response.ok) {
            throw new Error('Không thể cập nhật khuyến mãi.');
        }

        alert('Cập nhật khuyến mãi thành công!');
        fetchPromotions(); // Tải lại danh sách khuyến mãi
    } catch (error) {
        console.error('Lỗi khi cập nhật khuyến mãi:', error);
        alert('Không thể cập nhật khuyến mãi. Vui lòng thử lại sau.');
    }
}
async function deletePromotion(promotionId) {
    if (!confirm('Bạn có chắc chắn muốn xóa khuyến mãi này?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/promotions/${promotionId}`, {
            method: 'DELETE',
            headers: {
                'x-access-token': token
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Không thể xóa khuyến mãi.');
        }

        alert('Xóa khuyến mãi thành công!');
        fetchPromotions(); // Tải lại danh sách khuyến mãi
    } catch (error) {
        console.error('Lỗi khi xóa khuyến mãi:', error);
        alert(error.message || 'Không thể xóa khuyến mãi. Vui lòng thử lại sau.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchPromotions(currentPage); // Tải dữ liệu trang đầu tiên
});