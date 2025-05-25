const API_BASE_URL = 'http://127.0.0.1:8080';
const token = localStorage.getItem('token');
let currentPage = 1;
const pageSize = 10;

// Kiểm tra token
if (!token) {
    alert('Bạn cần đăng nhập để thực hiện thao tác này.');
    window.location.href = 'login_register.html'; // Chuyển hướng đến trang đăng nhập
}

// Lấy danh sách nhân viên
async function fetchEmployees(page = 1, searchQuery = '') {
    try {
        const url = searchQuery
            ? `${API_BASE_URL}/api/staff/search?name=${searchQuery}&page=${page}&size=${pageSize}`
            : `${API_BASE_URL}/api/staff?page=${page}&size=${pageSize}`;

        const response = await fetch(url, {
            headers: {
                'x-access-token': token
            }
        });

        if (!response.ok) {
            throw new Error('Không thể tải danh sách nhân viên.');
        }

        const data = await response.json();

        renderEmployees(data.data);
        setupPagination(data.totalPages, data.currentPage, searchQuery);
    } catch (error) {
        console.error('Lỗi khi tải danh sách nhân viên:', error);
        alert('Không thể tải danh sách nhân viên. Vui lòng thử lại sau.');
    }
}

// Hiển thị danh sách nhân viên
function renderEmployees(employees) {
    const tbody = document.getElementById('employees-tbody');
    tbody.innerHTML = '';

    employees.forEach(employee => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${employee.name}</td>
            <td>${employee.email}</td>
            <td>${employee.phone || 'Không có'}</td>
            <td>${employee.role}</td>
            <td>
                <button class="edit-btn" onclick="window.location.href='add_employee.html?id=${employee.staff_id}'">Sửa</button>
                <button class="delete-btn" onclick="deleteEmployee(${employee.staff_id})">Xóa</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Thêm phân trang
function setupPagination(totalPages, currentPage, searchQuery = '') {
    const paginationContainer = document.getElementById('pagination-container');
    paginationContainer.innerHTML = ''; // Xóa nội dung cũ

    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.className = i === currentPage ? 'active' : '';
        button.onclick = () => fetchEmployees(i, searchQuery); // Tải dữ liệu của trang được chọn
        paginationContainer.appendChild(button);
    }
}

// Tìm kiếm nhân viên
function searchEmployees() {
    const searchQuery = document.getElementById('search-input').value.trim();
    fetchEmployees(1, searchQuery); // Tìm kiếm từ trang đầu tiên
}

// Xóa nhân viên
async function deleteEmployee(employeeId) {
    if (!confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/staff/${employeeId}`, {
            method: 'DELETE',
            headers: {
                'x-access-token': token
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Không thể xóa nhân viên.');
        }

        alert('Xóa nhân viên thành công!');
        fetchEmployees(currentPage); // Tải lại danh sách nhân viên
    } catch (error) {
        console.error('Lỗi khi xóa nhân viên:', error);
        alert(error.message || 'Không thể xóa nhân viên. Vui lòng thử lại sau.');
    }
}

// Tải danh sách nhân viên khi trang được tải
document.addEventListener('DOMContentLoaded', () => {
    fetchEmployees(currentPage); // Tải dữ liệu trang đầu tiên
});