// Tab switching
document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        button.classList.add('active');
        document.getElementById(button.dataset.tab).classList.add('active');
    });
});

// Lịch sử mua hàng (giả lập dữ liệu)
const orders = [
    { id: '#12345', date: '2025-03-01', total: '500.000 VND', status: 'Hoàn thành' },
    { id: '#12346', date: '2025-03-15', total: '300.000 VND', status: 'Đang xử lý' },
    { id: '#12347', date: '2025-02-20', total: '200.000 VND', status: 'Hoàn thành' },
    { id: '#12348', date: '2025-01-10', total: '150.000 VND', status: 'Đang xử lý' },
    // Thêm nhiều đơn hàng hơn nếu cần
];

// Sắp xếp theo ngày gần nhất
orders.sort((a, b) => new Date(b.date) - new Date(a.date));

// Phân trang
const ordersPerPage = 2;
let currentPage = 1;

function renderOrders() {
    const start = (currentPage - 1) * ordersPerPage;
    const end = start + ordersPerPage;
    const paginatedOrders = orders.slice(start, end);

    const orderHistory = document.getElementById('order-history');
    orderHistory.innerHTML = paginatedOrders.map(order => `
        <tr>
            <td>${order.id}</td>
            <td>${order.date}</td>
            <td>${order.total}</td>
            <td>${order.status}</td>
            <td><button class="details-btn">Xem</button></td>
        </tr>
    `).join('');

    renderPagination();
}

function renderPagination() {
    const totalPages = Math.ceil(orders.length / ordersPerPage);
    const pagination = document.querySelector('.pagination');
    pagination.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.classList.add(i === currentPage ? 'active' : '');
        button.addEventListener('click', () => {
            currentPage = i;
            renderOrders();
        });
        pagination.appendChild(button);
    }
}

// Xử lý xem trước ảnh đại diện
document.getElementById('edit-avatar').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('avatar-preview-img').src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});
// Khởi tạo
renderOrders();