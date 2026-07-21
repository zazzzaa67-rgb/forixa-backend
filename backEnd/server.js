import express from 'express'
import cors from 'cors'
import bcrypt from 'bcrypt'
import dotenv from 'dotenv'
import db from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import projectRoutes from "./routes/projectRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
dotenv.config()
const app = express()
app.use(express.json())
app.use(cors())
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payment", paymentRoutes);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
console.log(`Server is running on port ${PORT}`);
});








