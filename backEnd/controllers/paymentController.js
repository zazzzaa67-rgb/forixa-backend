import db from "../config/db.js";
import paddle from "../config/paddle.js";

export const createCheckout = async (req, res) => {
    try {
        const { projectId } = req.body;
        const [projects] = await db.query(
            `SELECT * FROM projects WHERE id = ?`,
            [projectId]
        );
        if (projects.length === 0) {
            return res.status(404).json({
                error: "Project not found"
            });
        }
        const project = projects[0];
        if (!project.price) {
            return res.status(400).json({
                error: "Project price is not set"
            });
        }
        const [paymentResult] = await db.query(
            `INSERT INTO payments
            (client_id, project_id, marketer_id, amount, payment_method, status)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                project.client_id,
                project.id,
                project.marketer_id,
                project.price,
                "Paddle",
                "pending"
            ]
        );
        const paymentId = paymentResult.insertId;
        const transaction = await paddle.transactions.create({
            items: [
                {
                    priceId: process.env.PADDLE_PRICE_ID,
                    quantity: 1
                }
            ],
            customData: {
                projectId: project.id,
                paymentId,
                clientId: project.client_id,
                marketerId: project.marketer_id
            }
        });
        await db.query(
            `UPDATE payments
            SET transaction_id = ?
            WHERE id = ?`,
            [transaction.id, paymentId]
        );
        await db.query(
            `UPDATE projects
            SET payment_id = ?, 
            WHERE id = ?`,
            [paymentId, project.id]
        );
        res.json({
            checkoutUrl: transaction.checkout.url
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err.message
        });
    }
};
export const getClientToken = (req, res) => {
    res.json({
        clientToken: process.env.PADDLE_CLIENT_TOKEN
    });
};