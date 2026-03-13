require("dotenv").config()

const express = require("express")
const axios = require("axios")
const crypto = require("crypto")
const mongoose = require("mongoose")

const app = express()

/*
---------------------------------------
MONGODB CONNECTION
---------------------------------------
*/
mongoose.connect(process.env.MONGO_URI)
.then(()=>{
console.log("MongoDB connected")
})
.catch(err=>{
console.error("MongoDB connection error:", err)
})

/*
---------------------------------------
PAYMENT MODEL
---------------------------------------
*/
const paymentSchema = new mongoose.Schema({

reference:{type:String, unique:true},
email:String,
amount:Number,
site:String,
date:{
type:Date,
default:Date.now
}

})

const Payment = mongoose.model("Payment", paymentSchema)

/*
---------------------------------------
MIDDLEWARE
---------------------------------------
*/
app.use(express.json())
app.use(express.static("docs"))

/*
---------------------------------------
CREATE PAYMENT
---------------------------------------
*/
app.post("/create-payment",(req,res)=>{

const {email, amount, site, callback_url} = req.body

if(!email || !amount){
return res.status(400).json({error:"Missing payment data"})
}

res.json({
message:"Proceed to hosted checkout",
payment:{
email,
amount,
site,
callback_url
}
})

})

/*
---------------------------------------
VERIFY PAYMENT
---------------------------------------
*/
app.get("/verify/:reference", async (req,res)=>{

const reference = req.params.reference

try{

const response = await axios.get(
`https://api.paystack.co/transaction/verify/${reference}`,
{
headers:{
Authorization:`Bearer ${process.env.PAYSTACK_SECRET_KEY}`
}
}
)

const data = response.data.data

if(data.status === "success"){

const callback = data.metadata?.callback_url

console.log("Payment verified:", reference)

if(callback){
return res.redirect(callback + "?reference=" + reference)
}

return res.send("Payment verified")

}

res.send("Payment not verified")

}catch(err){

console.error(err)

res.status(500).send("Verification failed")

}

})

/*
---------------------------------------
PAYSTACK WEBHOOK (SECURE)
---------------------------------------
*/
app.post(
"/paystack/webhook",
express.json({
verify:(req,res,buf)=>{
req.rawBody = buf
}
}),
async (req,res)=>{

const secret = process.env.PAYSTACK_SECRET_KEY

const hash = crypto
.createHmac("sha512", secret)
.update(req.rawBody)
.digest("hex")

const signature = req.headers["x-paystack-signature"]

if(hash !== signature){
console.log("Invalid webhook signature")
return res.sendStatus(401)
}

const event = req.body

if(event.event === "charge.success"){

const reference = event.data.reference
const email = event.data.customer.email
const amount = event.data.amount
const site = event.data.metadata?.site || "unknown"

try{

// prevent duplicate transactions
const existing = await Payment.findOne({reference})

if(existing){
console.log("Duplicate webhook ignored:", reference)
return res.sendStatus(200)
}

const payment = new Payment({
reference,
email,
amount,
site
})

await payment.save()

console.log("Payment stored in MongoDB:", reference)

}catch(err){

console.error("Database error:", err)

}

}

res.sendStatus(200)

})

/*
---------------------------------------
START SERVER
---------------------------------------
*/
const PORT = process.env.PORT || 3000

app.listen(PORT, ()=>{
console.log(`Payment API running on port ${PORT}`)
})