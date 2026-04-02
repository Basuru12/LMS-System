const mongoose = require("mongoose");

async function connectDB() {
  const mongoUri =
    process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/lms_system";

  await mongoose.connect(mongoUri, {
    autoIndex: true,
  });

  return mongoose.connection;
}

async function disconnectDB() {
  await mongoose.disconnect();
}

module.exports = {
  connectDB,
  disconnectDB,
};
