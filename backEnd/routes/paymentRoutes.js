import express from 'express';
import { createCheckout ,getClientToken} from '../controllers/paymentController.js';
const router= express.Router();
router.post('/checkout' , createCheckout)
router.get("/token", getClientToken);
// router.post(
//     '/webhook',
//     express.raw({type:'application/json'}),
//     paddleWebhook
// )
export default router;
