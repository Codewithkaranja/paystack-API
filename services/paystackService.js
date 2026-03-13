const axios = require("axios")

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY

exports.verifyTransaction = async (reference)=>{

const response = await axios.get(
`https://api.paystack.co/transaction/verify/${reference}`,
{
headers:{
Authorization:`Bearer ${PAYSTACK_SECRET}`
}
}
)

return response.data.data

}