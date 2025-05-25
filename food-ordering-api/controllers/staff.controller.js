const db = require("../models");
const Staff = db.staffs;
const Shift = db.shift;
const ShiftAssignment = db.shift_assignment;
const Report = db.report;
const bcrypt = require("bcryptjs");

// Lấy thông tin nhân viên hiện tại
exports.getStaffProfile = (req, res) => {
  Staff.findByPk(req.userId, {
    attributes: { exclude: ['password'] }
  })
    .then(staff => {
      if (!staff) {
        return res.status(404).send({
          message: "Không tìm thấy thông tin nhân viên."
        });
      }
      res.status(200).send(staff);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Đã xảy ra lỗi khi lấy thông tin nhân viên."
      });
    });
};

// Lấy danh sách tất cả nhân viên với phân trang
exports.getAllStaff = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const size = parseInt(req.query.size) || 10;
  const offset = (page - 1) * size;

  Staff.findAndCountAll({
    attributes: { exclude: ['password'] },
    limit: size,
    offset: offset
  })
    .then(data => {
      const totalItems = data.count;
      const totalPages = Math.ceil(totalItems / size);
      const staffList = data.rows;

      res.status(200).send({
        totalItems,
        totalPages,
        currentPage: page,
        pageSize: size,
        data: staffList
      });
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Đã xảy ra lỗi khi lấy danh sách nhân viên."
      });
    });
};

// Thêm nhân viên mới
exports.createStaff = (req, res) => {
  // Validate request
  if (!req.body.name || !req.body.email || !req.body.password || !req.body.role) {
    return res.status(400).send({
      message: "Tên, email, mật khẩu và vai trò không được để trống!"
    });
  }

  // Kiểm tra email đã tồn tại chưa
  Staff.findOne({
    where: {
      email: req.body.email
    }
  })
    .then(existingStaff => {
      if (existingStaff) {
        return res.status(400).send({
          message: "Email đã được sử dụng!"
        });
      }

      // Tạo nhân viên mới
      const staff = {
        name: req.body.name,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 8),
        phone: req.body.phone,
        role: req.body.role,
        hire_date: req.body.hire_date || new Date()
      };

      // Lưu vào database
      Staff.create(staff)
        .then(newStaff => {
          res.status(201).send({
            message: "Đã thêm nhân viên mới thành công!",
            staff: {
              staff_id: newStaff.staff_id,
              name: newStaff.name,
              email: newStaff.email,
              role: newStaff.role,
              hire_date: newStaff.hire_date
            }
          });
        })
        .catch(err => {
          res.status(500).send({
            message: err.message || "Đã xảy ra lỗi khi thêm nhân viên mới."
          });
        });
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Đã xảy ra lỗi khi kiểm tra email."
      });
    });
};

// Cập nhật thông tin nhân viên
exports.updateStaff = (req, res) => {
  const id = req.params.id;

  // Loại bỏ các trường nhạy cảm
  const updateData = {
    name: req.body.name,
    phone: req.body.phone,
    role: req.body.role
  };

  // Nếu cập nhật mật khẩu
  if (req.body.password) {
    updateData.password = bcrypt.hashSync(req.body.password, 8);
  }

  Staff.update(updateData, {
    where: { staff_id: id }
  })
    .then(num => {
      if (num == 1) {
        res.status(200).send({
          message: "Cập nhật thông tin nhân viên thành công."
        });
      } else {
        res.status(404).send({
          message: `Không thể cập nhật thông tin nhân viên với ID: ${id}. Có thể nhân viên không tồn tại!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Đã xảy ra lỗi khi cập nhật thông tin nhân viên."
      });
    });
};

// Xóa nhân viên
exports.deleteStaff = (req, res) => {
  const id = req.params.id;

  Staff.destroy({
    where: { staff_id: id }
  })
    .then(num => {
      if (num == 1) {
        res.status(200).send({
          message: "Xóa nhân viên thành công!"
        });
      } else {
        res.status(404).send({
          message: `Không thể xóa nhân viên với ID: ${id}. Có thể nhân viên không tồn tại!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Đã xảy ra lỗi khi xóa nhân viên."
      });
    });
};

// Thêm ca làm việc
exports.createShift = async (req, res) => {
  try {
    // Validate request
    if (!req.body.staff_id || !req.body.start_time || !req.body.end_time) {
      return res.status(400).send({
        message: "ID nhân viên, thời gian bắt đầu và kết thúc không được để trống!"
      });
    }

    // Kiểm tra nhân viên tồn tại
    const staff = await Staff.findByPk(req.body.staff_id);
    
    if (!staff) {
      return res.status(404).send({
        message: "Không tìm thấy nhân viên!"
      });
    }

    // Tạo ca làm việc mới
    const shift = await Shift.create({
      start_time: new Date(req.body.start_time),
      end_time: new Date(req.body.end_time)
    });

    // Gán ca làm việc cho nhân viên
    await ShiftAssignment.create({
      shift_id: shift.shift_id,
      staff_id: req.body.staff_id
    });

    res.status(201).send({
      message: "Đã tạo ca làm việc mới!",
      shift
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Đã xảy ra lỗi khi tạo ca làm việc."
    });
  }
};

// Lấy danh sách ca làm việc với phân trang
exports.getShifts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 10;
    const offset = (page - 1) * size;

    const { count, rows } = await Shift.findAndCountAll({
      include: [{
        model: ShiftAssignment,
        as: "assignments",
        include: [{
          model: Staff,
          as: "staff",
          attributes: ["staff_id", "name", "role"]
        }]
      }],
      order: [["start_time", "DESC"]],
      limit: size,
      offset: offset,
      distinct: true
    });
    
    const totalItems = count;
    const totalPages = Math.ceil(totalItems / size);
    
    res.status(200).send({
      totalItems,
      totalPages,
      currentPage: page,
      pageSize: size,
      data: rows
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Đã xảy ra lỗi khi lấy danh sách ca làm việc."
    });
  }
};

// Lấy ca làm việc của nhân viên hiện tại với phân trang
exports.getStaffShifts = async (req, res) => {
  try {
    const staffId = req.userId;
    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 10;
    const offset = (page - 1) * size;
    
    const { count, rows } = await ShiftAssignment.findAndCountAll({
      where: { staff_id: staffId },
      include: [{
        model: Shift,
        as: "shift"
      }],
      order: [[{ model: Shift, as: "shift" }, "start_time", "DESC"]],
      limit: size,
      offset: offset
    });
    
    const shifts = rows.map(assignment => assignment.shift);
    const totalItems = count;
    const totalPages = Math.ceil(totalItems / size);
    
    res.status(200).send({
      totalItems,
      totalPages,
      currentPage: page,
      pageSize: size,
      data: shifts
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Đã xảy ra lỗi khi lấy ca làm việc."
    });
  }
};

// Tạo báo cáo công việc
exports.createReport = async (req, res) => {
  try {
    // Validate request
    if (!req.body.content) {
      return res.status(400).send({
        message: "Nội dung báo cáo không được để trống!"
      });
    }

    // Tạo báo cáo mới
    const report = await Report.create({
      staff_id: req.userId,
      report_date: new Date(),
      content: req.body.content
    });
    
    res.status(201).send({
      message: "Đã tạo báo cáo mới!",
      report
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Đã xảy ra lỗi khi tạo báo cáo."
    });
  }
};

// Lấy danh sách báo cáo với phân trang
exports.getAllReports = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 10;
    const offset = (page - 1) * size;

    const { count, rows } = await Report.findAndCountAll({
      include: [{
        model: Staff,
        as: "staff",
        attributes: ["staff_id", "name", "role"]
      }],
      order: [["report_date", "DESC"]],
      limit: size,
      offset: offset
    });
    
    const totalItems = count;
    const totalPages = Math.ceil(totalItems / size);
    
    res.status(200).send({
      totalItems,
      totalPages,
      currentPage: page,
      pageSize: size,
      data: rows
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Đã xảy ra lỗi khi lấy danh sách báo cáo."
    });
  }
};

// Cập nhật ca làm việc
exports.updateShift = async (req, res) => {
  try {
    const shiftId = req.params.id;

    // Validate request
    if (!req.body.start_time || !req.body.end_time || !req.body.staff_id) {
      return res.status(400).send({
        message: "ID nhân viên, thời gian bắt đầu và kết thúc không được để trống!"
      });
    }

    // Kiểm tra ca làm việc tồn tại
    const shift = await Shift.findByPk(shiftId);
    if (!shift) {
      return res.status(404).send({
        message: "Không tìm thấy ca làm việc!"
      });
    }

    // Kiểm tra nhân viên mới có tồn tại không
    const staff = await Staff.findByPk(req.body.staff_id);
    if (!staff) {
      return res.status(404).send({
        message: "Không tìm thấy nhân viên!"
      });
    }

    // Cập nhật shift
    await Shift.update(
      {
        start_time: new Date(req.body.start_time),
        end_time: new Date(req.body.end_time),
        staff_id: req.body.staff_id
      },
      { where: { shift_id: shiftId } }
    );

    // Cập nhật shift_assignment tương ứng
    await ShiftAssignment.update(
      { staff_id: req.body.staff_id },
      { where: { shift_id: shiftId } }
    );

    res.status(200).send({
      message: "Cập nhật ca làm việc thành công!"
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Đã xảy ra lỗi khi cập nhật ca làm việc."
    });
  }
};

// Xóa ca làm việc
exports.deleteShift = async (req, res) => {
  try {
    const shiftId = req.params.id;

    // Kiểm tra ca làm việc tồn tại
    const shift = await Shift.findByPk(shiftId);
    if (!shift) {
      return res.status(404).send({
        message: "Không tìm thấy ca làm việc!"
      });
    }

    // Xóa các bản ghi liên quan trong shift_assignments trước
    await ShiftAssignment.destroy({ where: { shift_id: shiftId } });

    // Sau đó xóa shift
    await Shift.destroy({ where: { shift_id: shiftId } });

    res.status(200).send({
      message: "Xóa ca làm việc thành công!"
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Đã xảy ra lỗi khi xóa ca làm việc."
    });
  }
};

// Tìm kiếm nhân viên theo tên
exports.searchStaffByName = async (req, res) => {
  try {
    const { name } = req.query;
    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 10;
    const offset = (page - 1) * size;

    if (!name) {
      return res.status(400).send({
        message: "Vui lòng nhập tên để tìm kiếm!"
      });
    }

    const { count, rows } = await Staff.findAndCountAll({
      where: {
        name: {
          [db.Sequelize.Op.like]: `%${name}%`
        }
      },
      attributes: { exclude: ['password'] },
      limit: size,
      offset: offset
    });

    const totalItems = count;
    const totalPages = Math.ceil(totalItems / size);

    res.status(200).send({
      totalItems,
      totalPages,
      currentPage: page,
      pageSize: size,
      data: rows
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Đã xảy ra lỗi khi tìm kiếm nhân viên."
    });
  }
};

// Lấy thông tin nhân viên qua ID
exports.getStaffById = (req, res) => {
  const id = req.params.id;

  Staff.findByPk(id, {
    attributes: { exclude: ['password'] } // Loại bỏ trường mật khẩu
  })
    .then(staff => {
      if (!staff) {
        return res.status(404).send({
          message: `Không tìm thấy nhân viên với ID: ${id}.`
        });
      }
      res.status(200).send(staff);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Đã xảy ra lỗi khi lấy thông tin nhân viên."
      });
    });
};