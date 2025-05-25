const API_BASE_URL = 'http://127.0.0.1:8080';
const token = localStorage.getItem('token');

// Kiểm tra token
if (!token) {
    alert('Bạn cần đăng nhập để thực hiện thao tác này.');
    window.location.href = 'login_register.html'; // Chuyển hướng đến trang đăng nhập
}

// Lấy tham số từ URL
const urlParams = new URLSearchParams(window.location.search);
const employeeId = urlParams.get('id');

// Hiển thị thông tin nhân viên cũ khi sửa
if (employeeId) {
    document.getElementById('form-title').textContent = 'Sửa Nhân Viên';
    fetchEmployeeById(employeeId);
}

// Lấy thông tin nhân viên qua ID
async function fetchEmployeeById(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/staff/${id}`, {
            headers: {
                'x-access-token': token
            }
        });

        if (!response.ok) {
            throw new Error('Không thể tải thông tin nhân viên.');
        }

        const employee = await response.json();

        // Điền dữ liệu cũ vào form
        document.getElementById('employee-id').value = employee.staff_id || '';
        document.getElementById('employee-name').value = employee.name || '';
        document.getElementById('employee-email').value = employee.email || '';
        document.getElementById('employee-phone').value = employee.phone || '';
        document.getElementById('employee-role').value = employee.role || 'employee';
    } catch (error) {
        console.error('Lỗi khi tải thông tin nhân viên:', error);
        alert('Không thể tải thông tin nhân viên. Vui lòng thử lại sau.');
    }
}

// Xử lý sự kiện submit form
document.getElementById('employee-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const employee = {
        name: document.getElementById('employee-name').value,
        email: document.getElementById('employee-email').value,
        phone: document.getElementById('employee-phone').value,
        role: document.getElementById('employee-role').value
    };

    // Chỉ thêm trường password nếu người dùng nhập giá trị
    const password = document.getElementById('employee-password').value;
    if (password) {
        employee.password = password;
    }

    console.log('Dữ liệu gửi đến backend:', employee); // Ghi log dữ liệu gửi đi

    if (employeeId) {
        // Sửa nhân viên
        await updateEmployee(employeeId, employee);
    } else {
        // Thêm nhân viên mới
        await addEmployee(employee);
    }
});

// Thêm nhân viên mới
async function addEmployee(employee) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/staff`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': token
            },
            body: JSON.stringify(employee)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Không thể thêm nhân viên.');
        }

        alert('Thêm nhân viên thành công!');
        window.location.href = 'employee.html';
    } catch (error) {
        console.error('Lỗi khi thêm nhân viên:', error);
        alert(error.message || 'Không thể thêm nhân viên. Vui lòng thử lại sau.');
    }
}

// Sửa nhân viên
async function updateEmployee(id, employee) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/staff/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': token
            },
            body: JSON.stringify(employee)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Không thể cập nhật nhân viên.');
        }

        alert('Cập nhật nhân viên thành công!');
        window.location.href = 'employee.html';
    } catch (error) {
        console.error('Lỗi khi cập nhật nhân viên:', error);
        alert(error.message || 'Không thể cập nhật nhân viên. Vui lòng thử lại sau.');
    }
}