// config/db.config.js
module.exports = {
    HOST: "127.0.0.1",
    USER: "root",
    PASSWORD: "123456789",
    DB: "food_ordering",
    dialect: "mysql",
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  };