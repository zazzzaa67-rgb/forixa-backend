import express from 'express';
import { createCheckout ,getClientToken,paddleWebhook} from '../controllers/paymentController.js';
const router= express.Router();
router.post('/checkout' , createCheckout)
router.get("/token", getClientToken);
router.post("/webhook", paddleWebhook);
export default router;
