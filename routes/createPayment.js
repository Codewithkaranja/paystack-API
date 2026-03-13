const express = require("express")
const router = express.Router()

router.post("/", (req,res)=>{

const {email,amount,site,callback_url} = req.body

const paymentData = {
email,
amount,
site,
callback_url
}

res.json({
message:"Proceed to checkout",
payment:paymentData
})

})

module.exports = router