// chart.js - Handles cart functionality

const API_BASE_URL = 'http://127.0.0.1:8080';
const ITEMS_PER_PAGE = 5;

// State
let currentPage = 1;
let totalPages = 1;

// Kiểm tra xem có phải là mua ngay không
const urlParams = new URLSearchParams(window.location.search);
const buyNowProduct = urlParams.get('buyNow');
const buyNowQuantity = urlParams.get('quantity');

// Biến lưu trữ thông tin khuyến mãi đang áp dụng
let currentPromotion = null;
let activePromotions = [];

// Lấy giỏ hàng từ backend
async function fetchCart(page = 1) {
    try {
        showLoading();
        const token = localStorage.getItem('token');
        
        if (!token) {
            showMessage('Vui lòng đăng nhập để xem giỏ hàng', 'error');
            return;
        }

        if (buyNowProduct) {
            // Nếu là mua ngay, lấy thông tin sản phẩm từ API
            const response = await fetch(`${API_BASE_URL}/api/products/${buyNowProduct}`, {
                headers: {
                    'x-access-token': token
                }
            });

            if (!response.ok) {
                throw new Error('Không thể tải thông tin sản phẩm.');
            }

            const data = await response.json();
            renderBuyNow(data.product, parseInt(buyNowQuantity) || 1);
        } else {
            // Lấy toàn bộ giỏ hàng (không phân trang) để tính tổng
            const allCartResponse = await fetch(`${API_BASE_URL}/api/cart`, {
                headers: {
                    'x-access-token': token
                }
            });

            if (!allCartResponse.ok) {
                throw new Error('Không thể tải thông tin giỏ hàng.');
            }

            const allCartData = await allCartResponse.json();

            // Lấy danh sách sản phẩm theo trang
            const response = await fetch(`${API_BASE_URL}/api/cart?page=${page}&size=${ITEMS_PER_PAGE}`, {
                headers: {
                    'x-access-token': token
                }
            });

            if (!response.ok) {
                throw new Error('Không thể tải giỏ hàng.');
            }

            const data = await response.json();

            if (!data.cart || !Array.isArray(data.cart.cart_items)) {
                throw new Error('Dữ liệu giỏ hàng không hợp lệ.');
            }

            currentPage = page;
            totalPages = Math.ceil(allCartData.cart.cart_items.length / ITEMS_PER_PAGE);
            
            // Hiển thị sản phẩm theo trang
            const startIndex = (page - 1) * ITEMS_PER_PAGE;
            const endIndex = startIndex + ITEMS_PER_PAGE;
            const itemsForCurrentPage = allCartData.cart.cart_items.slice(startIndex, endIndex);
            
            renderCart(itemsForCurrentPage);
            updateCartSummary(allCartData.cart); // Sử dụng toàn bộ giỏ hàng để tính tổng
            updatePagination();
        }
        hideLoading();
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
        showMessage('Không thể tải dữ liệu. Vui lòng thử lại sau.', 'error');
        document.getElementById('cart-container').innerHTML = '<div class="error">Không thể tải dữ liệu. Vui lòng thử lại sau.</div>';
        hideLoading();
    }
}

function renderCart(items) {
    const container = document.getElementById('cart-container');
    container.innerHTML = '';

    if (!items || items.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <img src="/images/empty-cart.png" alt="Giỏ hàng trống" />
                <p>Giỏ hàng của bạn đang trống</p>
                <a href="/pages/menu.html" class="continue-shopping">Tiếp tục mua sắm</a>
            </div>`;
        document.getElementById('cart-summary').style.display = 'none';
        document.getElementById('cart-pagination').style.display = 'none';
        return;
    }

    items.forEach(item => {
        if (!item.product) return;
        
        const product = item.product;
        const element = document.createElement('div');
        element.className = 'cart-item';
        element.innerHTML = `
            <div class="item-image">
                <img src="${product.image_url}" alt="${product.name}" onerror="this.src='/images/default-food.png'" />
            </div>
            <div class="item-details">
                <div class="item-name">${product.name}</div>
                <div class="item-price-single">${product.price.toLocaleString()} VND / món</div>
                <div class="item-quantity">
                    <button class="quantity-btn decrease" data-id="${item.cart_item_id}">-</button>
                    <input type="number" class="quantity-input" data-id="${item.cart_item_id}" 
                           value="${item.quantity}" min="1" max="99">
                    <button class="quantity-btn increase" data-id="${item.cart_item_id}">+</button>
                </div>
                <div class="item-price">${(product.price * item.quantity).toLocaleString()} VND</div>
            </div>
            <button class="remove-btn" data-id="${item.cart_item_id}" title="Xóa sản phẩm">
                <i class="fas fa-trash"></i>
            </button>
        `;
        container.appendChild(element);
    });

    // Gắn sự kiện xóa sản phẩm
    document.querySelectorAll('.remove-btn').forEach(button => {
        button.addEventListener('click', async (event) => {
            const cartItemId = event.currentTarget.getAttribute('data-id');
            if (confirm('Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?')) {
                await removeFromCart(cartItemId);
            }
        });
    });

    // Gắn sự kiện tăng/giảm số lượng
    document.querySelectorAll('.quantity-btn').forEach(button => {
        button.addEventListener('click', async (event) => {
            const cartItemId = event.target.getAttribute('data-id');
            const input = document.querySelector(`.quantity-input[data-id="${cartItemId}"]`);
            let quantity = parseInt(input.value);

            if (event.target.classList.contains('increase')) {
                if (quantity < 99) {
                    quantity++;
                    await updateCartItem(cartItemId, quantity);
                } else {
                    showMessage('Số lượng tối đa là 99', 'error');
                }
            } else if (event.target.classList.contains('decrease')) {
                if (quantity > 1) {
                    quantity--;
                    await updateCartItem(cartItemId, quantity);
                }
            }
        });
    });

    // Gắn sự kiện nhập số lượng
    document.querySelectorAll('.quantity-input').forEach(input => {
        let previousValue;
        
        input.addEventListener('focus', (e) => {
            previousValue = e.target.value;
        });

        input.addEventListener('change', async (event) => {
            const cartItemId = event.target.getAttribute('data-id');
            let quantity = parseInt(event.target.value);

            if (isNaN(quantity) || quantity < 1) {
                quantity = 1;
                event.target.value = quantity;
                showMessage('Số lượng không hợp lệ', 'error');
            } else if (quantity > 99) {
                quantity = 99;
                event.target.value = quantity;
                showMessage('Số lượng tối đa là 99', 'error');
            }

            if (quantity !== parseInt(previousValue)) {
                await updateCartItem(cartItemId, quantity);
            }
        });
    });

    document.getElementById('cart-summary').style.display = 'block';
    document.getElementById('cart-pagination').style.display = totalPages > 1 ? 'flex' : 'none';
}

// Render cho trường hợp mua ngay
function renderBuyNow(product, quantity) {
    const container = document.getElementById('cart-container');
    container.innerHTML = `
        <div class="cart-item">
            <div class="item-image">
                <img src="${product.image_url}" alt="${product.name}" onerror="this.src='/images/default-food.png'" />
            </div>
            <div class="item-details">
                <div class="item-name">${product.name}</div>
                <div class="item-price-single">${product.price.toLocaleString()} VND / món</div>
                <div class="item-quantity">
                    <button class="quantity-btn decrease" data-id="buynow">-</button>
                    <input type="number" class="quantity-input" data-id="buynow" 
                           value="${quantity}" min="1" max="99">
                    <button class="quantity-btn increase" data-id="buynow">+</button>
                </div>
                <div class="item-price">${(product.price * quantity).toLocaleString()} VND</div>
            </div>
        </div>`;

    // Gắn sự kiện cho nút tăng/giảm số lượng
    document.querySelectorAll('.quantity-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const input = document.querySelector('.quantity-input[data-id="buynow"]');
            let quantity = parseInt(input.value);

            if (event.target.classList.contains('increase')) {
                if (quantity < 99) {
                    quantity++;
                } else {
                    showMessage('Số lượng tối đa là 99', 'error');
                }
            } else if (event.target.classList.contains('decrease')) {
                if (quantity > 1) {
                    quantity--;
                }
            }

            input.value = quantity;
            updateBuyNowSummary(product, quantity);
        });
    });

    // Gắn sự kiện cho input số lượng
    const quantityInput = document.querySelector('.quantity-input[data-id="buynow"]');
    let previousValue = quantity;
    
    quantityInput.addEventListener('focus', (e) => {
        previousValue = e.target.value;
    });

    quantityInput.addEventListener('change', (event) => {
        let quantity = parseInt(event.target.value);

        if (isNaN(quantity) || quantity < 1) {
            quantity = 1;
            event.target.value = quantity;
            showMessage('Số lượng không hợp lệ', 'error');
        } else if (quantity > 99) {
            quantity = 99;
            event.target.value = quantity;
            showMessage('Số lượng tối đa là 99', 'error');
        }

        if (quantity !== parseInt(previousValue)) {
            updateBuyNowSummary(product, quantity);
        }
    });

    // Ẩn phân trang vì mua ngay chỉ có 1 sản phẩm
    document.getElementById('cart-pagination').style.display = 'none';
    
    updateBuyNowSummary(product, quantity);
}

// Cập nhật tổng tiền cho trường hợp mua ngay
function updateBuyNowSummary(product, quantity) {
    const summaryElement = document.getElementById('cart-summary');
    if (!summaryElement) return;

    const totalPrice = product.price * quantity;

    summaryElement.innerHTML = `
        <div class="summary-content">
            <div class="summary-row">
                <span>Tổng số lượng:</span>
                <span id="total-quantity">${quantity} món</span>
            </div>
            <div class="summary-row">
                <span>Tổng tiền:</span>
                <span id="total-price">${totalPrice.toLocaleString()} VND</span>
            </div>
            <div class="promotion-section">
                <h3>Mã giảm giá</h3>
                <div class="promotion-select">
                    <select id="promotion-select">
                        <option value="">Chọn mã giảm giá</option>
                    </select>
                    <button id="view-promotion-details" class="view-details-btn" disabled>
                        <i class="fas fa-info-circle"></i> Chi tiết
                    </button>
                </div>
                <div id="applied-promotion" class="applied-promotion" style="display: none;">
                    <div class="discount-info">
                        <span>Giảm giá: <span id="discount-amount">0</span>%</span>
                        <span>Tiết kiệm: <span id="saved-amount">0</span> VND</span>
                    </div>
                    <div class="final-price">
                        <span>Tổng thanh toán:</span>
                        <span id="final-price">0 VND</span>
                    </div>
                </div>
            </div>
            <div class="payment-methods">
                <h3>Phương thức thanh toán</h3>
                <div class="payment-options">
                    <div class="payment-option">
                        <label for="cod">
                            <div class="payment-info">
                                <i class="fas fa-money-bill-wave"></i>
                                <span>Thanh toán khi nhận hàng (COD)</span>
                            </div>
                            <input type="radio" id="cod" name="payment-method" value="COD" checked>
                        </label>
                    </div>
                    <div class="payment-option">
                        <label for="banking">
                            <div class="payment-info">
                                <i class="fas fa-university"></i>
                                <span>Chuyển khoản ngân hàng</span>
                            </div>
                            <input type="radio" id="banking" name="payment-method" value="BANKING">
                        </label>
                    </div>
                </div>
            </div>
            <button id="checkout-btn" class="checkout-btn">
                <i class="fas fa-shopping-bag"></i>
                <span>Đặt hàng - ${totalPrice.toLocaleString()} VND</span>
            </button>
        </div>
    `;

    summaryElement.style.display = 'block';
    
    // Tải danh sách mã giảm giá
    loadActivePromotions();
    
    // Khởi tạo nút đặt hàng
    initCheckoutButton(true);
}

// Cập nhật tổng số lượng và tổng giá tiền
function updateCartSummary(cart) {
    const summaryElement = document.getElementById('cart-summary');
    if (!summaryElement) return;

    // Tính tổng số lượng và tổng tiền từ toàn bộ cart_items
    let totalQuantity = 0;
    let totalPrice = 0;

    if (cart.cart_items && Array.isArray(cart.cart_items)) {
        cart.cart_items.forEach(item => {
            if (item.product && item.quantity) {
                totalQuantity += parseInt(item.quantity);
                totalPrice += parseFloat(item.product.price) * parseInt(item.quantity);
            }
        });
    }

    summaryElement.innerHTML = `
        <div class="summary-content">
            <div class="summary-row">
                <span>Tổng số lượng:</span>
                <span id="total-quantity">${totalQuantity} món</span>
            </div>
            <div class="summary-row">
                <span>Tổng tiền:</span>
                <span id="total-price">${totalPrice.toLocaleString()} VND</span>
            </div>
            <div class="payment-methods">
                <h3>Phương thức thanh toán</h3>
                <div class="payment-options">
                    <div class="payment-option">
                        <label for="cod">
                            <div class="payment-info">
                                <i class="fas fa-money-bill-wave"></i>
                                <span>Thanh toán khi nhận hàng (COD)</span>
                            </div>
                            <input type="radio" id="cod" name="payment-method" value="COD" checked>
                        </label>
                    </div>
                    <div class="payment-option">
                        <label for="banking">
                            <div class="payment-info">
                                <i class="fas fa-university"></i>
                                <span>Chuyển khoản ngân hàng</span>
                            </div>
                            <input type="radio" id="banking" name="payment-method" value="BANKING">
                        </label>
                    </div>
                </div>
            </div>
            <button id="checkout-btn" class="checkout-btn" ${totalQuantity === 0 ? 'disabled' : ''}>
                <i class="fas fa-shopping-bag"></i>
                <span>Đặt hàng - ${totalPrice.toLocaleString()} VND</span>
            </button>
        </div>
    `;

    summaryElement.style.display = 'block';
    initCheckoutButton();

    // Tải danh sách mã giảm giá
    loadActivePromotions();

    // Cập nhật thông tin giảm giá nếu đang có
    if (currentPromotion) {
        updateDiscountInfo();
    }
}

// Cập nhật số lượng sản phẩm trong giỏ hàng
async function updateCartItem(cartItemId, quantity) {
    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/api/cart/items/${cartItemId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': localStorage.getItem('token')
            },
            body: JSON.stringify({ quantity })
        });

        if (!response.ok) {
            throw new Error('Không thể cập nhật số lượng sản phẩm.');
        }

        await fetchCart();
        showMessage('Đã cập nhật số lượng sản phẩm', 'success');
    } catch (error) {
        console.error('Lỗi khi cập nhật số lượng sản phẩm:', error);
        showMessage('Không thể cập nhật số lượng sản phẩm. Vui lòng thử lại.', 'error');
    } finally {
        hideLoading();
    }
}

// Xóa sản phẩm khỏi giỏ hàng
async function removeFromCart(cartItemId) {
    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/api/cart/items/${cartItemId}`, {
            method: 'DELETE',
            headers: {
                'x-access-token': localStorage.getItem('token')
            }
        });

        if (!response.ok) {
            throw new Error('Không thể xóa sản phẩm khỏi giỏ hàng.');
        }

        showMessage('Đã xóa sản phẩm khỏi giỏ hàng', 'success');
        await fetchCart();
    } catch (error) {
        console.error('Lỗi khi xóa sản phẩm:', error);
        showMessage('Không thể xóa sản phẩm. Vui lòng thử lại.', 'error');
    } finally {
        hideLoading();
    }
}

// Thanh toán giỏ hàng
function initCheckoutButton(isBuyNow = false) {
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', async () => {
            try {
                showLoading();
                const paymentMethodElement = document.querySelector('input[name="payment-method"]:checked');
                const paymentMethod = paymentMethodElement ? paymentMethodElement.value : 'COD';

                const orderData = {
                    payment_method: paymentMethod,
                    promotion_id: currentPromotion ? currentPromotion.promotion_id : null
                };

                if (isBuyNow) {
                    const quantity = document.querySelector('.quantity-input[data-id="buynow"]').value;
                    orderData.product_id = buyNowProduct;
                    orderData.quantity = parseInt(quantity);
                }

                const response = await fetch(`${API_BASE_URL}/api/orders/${isBuyNow ? 'direct' : ''}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-access-token': localStorage.getItem('token')
                    },
                    body: JSON.stringify(orderData)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Không thể tạo đơn hàng.');
                }

                showMessage('Đơn hàng của bạn đã được tạo thành công!', 'success');
                await new Promise(resolve => setTimeout(resolve, 1000));
                window.location.href = 'user_profile.html';
            } catch (error) {
                console.error('Lỗi khi đặt hàng:', error);
                showMessage(error.message || 'Không thể đặt hàng. Vui lòng thử lại.', 'error');
            } finally {
                hideLoading();
            }
        });
    }
}

// Hiển thị loading
function showLoading() {
    const loading = document.getElementById('loading') || createLoadingElement();
    loading.style.display = 'flex';
}

// Ẩn loading
function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'none';
    }
}

// Tạo element loading nếu chưa có
function createLoadingElement() {
    const loading = document.createElement('div');
    loading.id = 'loading';
    loading.className = 'loading';
    loading.innerHTML = '<div class="loading-spinner"></div>';
    document.body.appendChild(loading);
    return loading;
}

// Hiển thị thông báo
function showMessage(message, type = 'info') {
    const toast = document.getElementById('message-toast') || createToastElement();
    const toastMessage = document.getElementById('toast-message');
    
    toast.className = `message-toast ${type}`;
    toastMessage.textContent = message;
    
    toast.style.display = 'block';
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-100%)';
        
        setTimeout(() => {
            toast.style.display = 'none';
        }, 500);
    }, 3000);
}

// Tạo element toast nếu chưa có
function createToastElement() {
    const toast = document.createElement('div');
    toast.id = 'message-toast';
    toast.className = 'message-toast';
    toast.innerHTML = '<span id="toast-message"></span>';
    document.body.appendChild(toast);
    return toast;
}

// Cập nhật phân trang
function updatePagination() {
    const paginationElement = document.getElementById('cart-pagination');
    const pageInfo = document.getElementById('page-info');
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');

    if (totalPages <= 1) {
        paginationElement.style.display = 'none';
        return;
    }

    paginationElement.style.display = 'flex';
    pageInfo.textContent = `Trang ${currentPage} / ${totalPages}`;
    prevButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage === totalPages;

    prevButton.onclick = () => {
        if (currentPage > 1) {
            fetchCart(currentPage - 1);
        }
    };

    nextButton.onclick = () => {
        if (currentPage < totalPages) {
            fetchCart(currentPage + 1);
        }
    };
}

// Tải giỏ hàng khi trang được tải
document.addEventListener('DOMContentLoaded', () => {
    fetchCart();
});

// Tải danh sách mã giảm giá đang hoạt động
async function loadActivePromotions() {
    try {
        // Kiểm tra xem phần tử promotion-select có tồn tại không
        let select = document.getElementById('promotion-select');
        if (!select) {
            // Nếu không tồn tại, tạo mới section khuyến mãi
            const summaryContent = document.querySelector('.summary-content');
            if (summaryContent) {
                const promotionSection = document.createElement('div');
                promotionSection.className = 'promotion-section';
                promotionSection.innerHTML = `
                    <h3>Mã giảm giá</h3>
                    <div class="promotion-select">
                        <select id="promotion-select">
                            <option value="">Chọn mã giảm giá</option>
                        </select>
                        <button id="view-promotion-details" class="view-details-btn" disabled>
                            <i class="fas fa-info-circle"></i> Chi tiết
                        </button>
                    </div>
                    <div id="applied-promotion" class="applied-promotion" style="display: none;">
                        <div class="discount-info">
                            <span>Giảm giá: <span id="discount-amount">0</span>%</span>
                            <span>Tiết kiệm: <span id="saved-amount">0</span> VND</span>
                        </div>
                        <div class="final-price">
                            <span>Tổng thanh toán:</span>
                            <span id="final-price">0 VND</span>
                        </div>
                    </div>
                `;

                // Chèn vào trước phần payment methods
                const paymentMethods = summaryContent.querySelector('.payment-methods');
                if (paymentMethods) {
                    summaryContent.insertBefore(promotionSection, paymentMethods);
                } else {
                    summaryContent.appendChild(promotionSection);
                }
                
                // Cập nhật biến select sau khi tạo mới
                select = document.getElementById('promotion-select');
            }
        }

        // Tiếp tục chỉ khi có select element
        if (select) {
            const response = await fetch(`${API_BASE_URL}/api/promotions/active`, {
                headers: {
                    'x-access-token': localStorage.getItem('token')
                }
            });

            if (!response.ok) {
                throw new Error('Không thể tải danh sách mã giảm giá');
            }

            const data = await response.json();
            activePromotions = data.promotions || [];

            // Cập nhật select box
            select.innerHTML = `
                <option value="">Chọn mã giảm giá</option>
                ${activePromotions.map(p => `
                    <option value="${p.promotion_id}">${p.title} - Giảm ${parseFloat(p.discount_percent).toFixed(0)}%</option>
                `).join('')}
            `;

            // Gắn sự kiện cho select box
            select.addEventListener('change', handlePromotionSelect);

            // Gắn sự kiện cho nút xem chi tiết
            const viewDetailsBtn = document.getElementById('view-promotion-details');
            if (viewDetailsBtn) {
                viewDetailsBtn.disabled = activePromotions.length === 0;
                viewDetailsBtn.addEventListener('click', showPromotionDetails);
            }
        }
    } catch (error) {
        console.error('Lỗi khi tải mã giảm giá:', error);
        showMessage('Không thể tải danh sách mã giảm giá', 'error');
    }
}

// Xử lý khi chọn mã giảm giá
async function handlePromotionSelect(event) {
    const promotionId = event.target.value;
    const viewDetailsBtn = document.getElementById('view-promotion-details');
    
    if (!promotionId) {
        currentPromotion = null;
        viewDetailsBtn.disabled = true;
        document.getElementById('applied-promotion').style.display = 'none';
        updateCheckoutPrice();
        return;
    }

    try {
        const promotion = activePromotions.find(p => p.promotion_id.toString() === promotionId);
        if (!promotion) {
            throw new Error('Không tìm thấy thông tin mã giảm giá');
        }

        currentPromotion = promotion;
        viewDetailsBtn.disabled = false;
        
        // Hiển thị thông tin giảm giá
        updateDiscountInfo();
        showMessage('Đã áp dụng mã giảm giá', 'success');
    } catch (error) {
        console.error('Lỗi khi áp dụng mã giảm giá:', error);
        showMessage('Không thể áp dụng mã giảm giá', 'error');
    }
}

// Cập nhật thông tin giảm giá
function updateDiscountInfo() {
    const appliedPromotion = document.getElementById('applied-promotion');
    const totalPrice = parseInt(document.getElementById('total-price').textContent.replace(/[^\d]/g, ''));
    
    if (currentPromotion && totalPrice > 0) {
        const discountAmount = Math.floor((totalPrice * currentPromotion.discount_percent) / 100);
        const finalPrice = totalPrice - discountAmount;

        document.getElementById('discount-amount').textContent = currentPromotion.discount_percent;
        document.getElementById('saved-amount').textContent = discountAmount.toLocaleString();
        document.getElementById('final-price').textContent = `${finalPrice.toLocaleString()} VND`;
        
        appliedPromotion.style.display = 'block';
        updateCheckoutPrice(finalPrice);
    } else {
        appliedPromotion.style.display = 'none';
        updateCheckoutPrice(totalPrice);
    }
}

// Cập nhật giá trên nút đặt hàng
function updateCheckoutPrice(price) {
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        const span = checkoutBtn.querySelector('span');
        span.textContent = `Đặt hàng - ${price.toLocaleString()} VND`;
    }
}

// Hiển thị chi tiết mã giảm giá
function showPromotionDetails() {
    if (!currentPromotion) return;

    // Tạo modal nếu chưa có
    let modal = document.getElementById('promotion-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'promotion-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Chi tiết mã giảm giá</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="promotion-details">
                        <div class="detail-row">
                            <span class="label">Tên khuyến mãi:</span>
                            <span id="modal-code" class="value"></span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Giảm giá:</span>
                            <span id="modal-discount" class="value"></span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Mô tả:</span>
                            <p id="modal-description" class="value"></p>
                        </div>
                        <div class="detail-row">
                            <span class="label">Thời gian:</span>
                            <div id="modal-validity" class="value">
                                <div>Bắt đầu: <span id="modal-start-date"></span></div>
                                <div>Kết thúc: <span id="modal-end-date"></span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Cập nhật thông tin trong modal
    document.getElementById('modal-code').textContent = currentPromotion.title;
    document.getElementById('modal-discount').textContent = `${parseFloat(currentPromotion.discount_percent).toFixed(0)}%`;
    document.getElementById('modal-description').textContent = currentPromotion.description || 'Không có mô tả';
    document.getElementById('modal-start-date').textContent = formatDate(currentPromotion.start_date);
    document.getElementById('modal-end-date').textContent = formatDate(currentPromotion.end_date);

    // Hiển thị modal
    modal.style.display = 'block';

    // Gắn sự kiện đóng modal
    const closeBtn = modal.querySelector('.close-modal');
    if (closeBtn) {
        closeBtn.onclick = () => modal.style.display = 'none';
    }

    // Đóng modal khi click bên ngoài
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}

// Format date helper
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}