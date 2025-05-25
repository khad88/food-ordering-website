const authJwt = require("../middlewares/authJwt");
const controller = require("../controllers/staff.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // Lấy thông tin nhân viên hiện tại
  app.get(
    "/api/staff/profile",
    [authJwt.verifyToken, authJwt.isStaff],
    controller.getStaffProfile
  );

  // Lấy danh sách nhân viên (chỉ manager)
  app.get(
    "/api/staff",
    [authJwt.verifyToken, authJwt.isManager],
    controller.getAllStaff
  );

  // Thêm nhân viên mới (chỉ manager)
  app.post(
    "/api/staff",
    [authJwt.verifyToken, authJwt.isManager],
    controller.createStaff
  );

  // Cập nhật thông tin nhân viên (chỉ manager)
  app.put(
    "/api/staff/:id",
    [authJwt.verifyToken, authJwt.isManager],
    controller.updateStaff
  );

  // Xóa nhân viên (chỉ manager)
  app.delete(
    "/api/staff/:id",
    [authJwt.verifyToken, authJwt.isManager],
    controller.deleteStaff
  );

  // Thêm ca làm việc cho nhân viên (chỉ manager)
  app.post(
    "/api/shifts",
    [authJwt.verifyToken, authJwt.isManager],
    controller.createShift
  );

  // Lấy danh sách ca làm việc
  app.get(
    "/api/shifts",
    [authJwt.verifyToken, authJwt.isStaff],
    controller.getShifts
  );

  // Lấy ca làm việc của nhân viên hiện tại
  app.get(
    "/api/staff/shifts",
    [authJwt.verifyToken, authJwt.isStaff],
    controller.getStaffShifts
  );

  // Tạo báo cáo công việc
  app.post(
    "/api/reports",
    [authJwt.verifyToken, authJwt.isStaff],
    controller.createReport
  );

  // Lấy danh sách báo cáo (chỉ manager)
  app.get(
    "/api/reports",
    [authJwt.verifyToken, authJwt.isManager],
    controller.getAllReports
  );

  // Cập nhật ca làm việc (chỉ manager)
  app.put(
    "/api/shifts/:id",
    [authJwt.verifyToken, authJwt.isManager],
    controller.updateShift
  );

  // Xóa ca làm việc (chỉ manager)
  app.delete(
    "/api/shifts/:id",
    [authJwt.verifyToken, authJwt.isManager],
    controller.deleteShift
  );  

    // Tìm kiếm nhân viên theo tên
    app.get(
      "/api/staff/search",
      [authJwt.verifyToken], 
      controller.searchStaffByName
    );
  
    // Lấy thông tin nhân viên qua ID (chỉ manager)
  app.get(
    "/api/staff/:id",
    [authJwt.verifyToken, authJwt.isManager],
    controller.getStaffById
  );
};


