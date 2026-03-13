const express = require("express")
const crypto = require("crypto")
const fs = require("fs")
const path = require("path")

const router = express.Router()

const paymentsFile = path.join(__dirname, "..", "logs", "payments.json")

router.post(
"/",
express.json({
verify: (req, res, buf) => {
req.rawBody = buf
}
}),
(req,res)=>{

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

const paymentRecord = {
reference,
email,
amount,
site,
date: new Date().toISOString()
}

let payments = []

if(fs.existsSync(paymentsFile)){
payments = JSON.parse(fs.readFileSync(paymentsFile))
}

payments.push(paymentRecord)

fs.writeFileSync(paymentsFile, JSON.stringify(payments,null,2))

console.log("Payment logged:", paymentRecord)

}

res.sendStatus(200)

})

module.exports = router