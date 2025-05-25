const API_BASE_URL = 'http://127.0.0.1:8080';
const token = localStorage.getItem('token');

// Kiểm tra token
if (!token) {
    alert('Bạn cần đăng nhập để thực hiện thao tác này.');
    window.location.href = 'login_register.html'; // Chuyển hướng đến trang đăng nhập
}

// Lấy tham số từ URL
const urlParams = new URLSearchParams(window.location.search);
const promotionId = urlParams.get('id');

// Hiển thị dữ liệu cũ khi sửa khuyến mãi
if (promotionId) {
    document.getElementById('form-title').textContent = 'Sửa Khuyến mãi';
    fetchPromotionById(promotionId);
}

// Lấy thông tin khuyến mãi theo ID
async function fetchPromotionById(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/promotions/${id}`, {
            headers: {
                'x-access-token': token
            }
        });

        if (!response.ok) {
            throw new Error('Không thể tải thông tin khuyến mãi.');
        }

        const promotion = await response.json();

        // Điền dữ liệu cũ vào form
        document.getElementById('promotion-id').value = promotion.promotion_id || '';
        document.getElementById('promo-title').value = promotion.title || '';
        document.getElementById('promo-description').value = promotion.description || '';
        document.getElementById('discount-percent').value = promotion.discount_percent || 0;
        document.getElementById('start-date').value = promotion.start_date || '';
        document.getElementById('end-date').value = promotion.end_date || '';
        document.getElementById('is-active').value = promotion.is_active ? 'true' : 'false';
    } catch (error) {
        console.error('Lỗi khi tải thông tin khuyến mãi:', error);
        alert('Không thể tải thông tin khuyến mãi. Vui lòng thử lại sau.');
    }
}

// Xử lý submit form
document.getElementById('promotion-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const promotion = {
        title: document.getElementById('promo-title').value,
        description: document.getElementById('promo-description').value,
        discount_percent: parseInt(document.getElementById('discount-percent').value, 10),
        start_date: document.getElementById('start-date').value,
        end_date: document.getElementById('end-date').value,
        is_active: document.getElementById('is-active').value === 'true'
    };

    if (promotionId) {
        // Sửa khuyến mãi
        await updatePromotion(promotionId, promotion);
    } else {
        // Thêm khuyến mãi mới
        await addPromotion(promotion);
    }
});

// Thêm khuyến mãi mới
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
        window.location.href = 'promotions.html';
    } catch (error) {
        console.error('Lỗi khi thêm khuyến mãi:', error);
        alert('Không thể thêm khuyến mãi. Vui lòng thử lại sau.');
    }
}

// Sửa khuyến mãi
async function updatePromotion(id, promotion) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/promotions/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': token
            },
            body: JSON.stringify(promotion)
        });

        if (!response.ok) {
            throw new Error('Không thể cập nhật khuyến mãi.');
        }

        alert('Cập nhật khuyến mãi thành công!');
        window.location.href = 'promotions.html';
    } catch (error) {
        console.error('Lỗi khi cập nhật khuyến mãi:', error);
        alert('Không thể cập nhật khuyến mãi. Vui lòng thử lại sau.');
    }
}