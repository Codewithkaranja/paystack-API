const mongoose = require("mongoose")

const paymentSchema = new mongoose.Schema({
  reference: String,
  email: String,
  amount: Number,
  site: String,
  date: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model("Payment", paymentSchema)