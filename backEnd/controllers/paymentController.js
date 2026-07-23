import paddle from '../config/paddle.js'

export const createCheckout = async (req,res)=>{
    try{
        const {projectId} = req.body;
        const transaction = await paddle.transactions.create({
            items : [
                {
                    priceId : process.env.PADDLE_PRICE_ID,
                    quantity : 1
                }
            ],
            customData:{
                projectId
            }
        });
        console.log(transaction.checkout.url);
        res.json({
        transactionId: transaction.id,
        checkoutUrl: transaction.checkout.url
        });
    }catch(err){
        console.error("PADDLE ERROR:");
        console.error(err);
        res.status(500).json({
            error : err.message,
            full : err
        });
    }
}
export const getClientToken = (req, res) => {
    res.json({
        clientToken: process.env.PADDLE_CLIENT_TOKEN
    });
};