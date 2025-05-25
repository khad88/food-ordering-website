const express = require("express");
const cors = require("cors");
const db = require("./models");

const app = express();

// Cấu hình CORS
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:8081", 
    "http://localhost:5000",
    "http://127.0.0.1:8081",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5000",
    "http://127.0.0.1:5500",
    "null" // Cho phép file:// protocol (khi mở HTML trực tiếp)
  ]
};
app.use(cors(corsOptions));

// Parse requests dạng application/json
app.use(express.json());

// Parse requests dạng application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// Khởi tạo database - Uncomment nếu muốn Sequelize tự tạo tables
// db.sequelize.sync();

// Nếu muốn reset database mỗi lần khởi động (chỉ dùng khi dev):
// db.sequelize.sync({ force: true }).then(() => {
//   console.log("Drop and re-sync db.");
// });

// Route đơn giản
app.get("/", (req, res) => {
  res.json({ message: "Chào mừng tới KhoaFood API." });
});

// Khai báo các routes
require("./routes/auth.routes")(app);
require("./routes/user.routes")(app);
require("./routes/product.routes")(app);
require("./routes/order.routes")(app);
require("./routes/staff.routes")(app);
require("./routes/dashboard.routes")(app);
require("./routes/promotion.routes")(app);

// Thiết lập port và lắng nghe requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0',() => {
  console.log(`Server đang chạy trên port ${PORT}.`);
});