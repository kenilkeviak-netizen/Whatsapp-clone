const mongoose = require("mongoose");

const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongooDB Database connected");
  } catch (error) {
    console.log("Connection Error", error.message);
    process.exit[1];
  }
};

module.exports = connectDb;
 