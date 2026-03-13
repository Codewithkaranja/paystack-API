const express = require("express")
const router = express.Router()

const {verifyTransaction} = require("../services/paystackService")

router.get("/:reference", async (req,res)=>{

const reference = req.params.reference

try{

const data = await verifyTransaction(reference)

if(data.status === "success"){

const callback = data.metadata?.callback_url

if(callback){

return res.redirect(callback + "?reference=" + reference)

}

return res.send("Payment verified")

}

res.send("Payment not verified")

}catch(err){

console.error(err)

res.send("Verification error")

}

})

module.exports = router