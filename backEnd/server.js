import express from 'express'
import cors from 'cors'
import bcrypt from 'bcrypt'
import "dotenv/config";
import authRoutes from './routes/authRoutes.js'
import projectRoutes from "./routes/projectRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
const app = express()
app.use(
    "/api/payment/webhook",
    express.raw({ type: "application/json" })
);
app.use(express.json())
app.use(cors())
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payment", paymentRoutes);
export default app;







