import jwt from "jsonwebtoken";

export const adminLogin = (req, res) => {
    const { email, password } = req.body;
    if (
        email !== process.env.ADMIN_EMAIL ||
        password !== process.env.ADMIN_PASSWORD
    ) {
        return res.status(401).json({
            message: "Wrong email or password"
        });
    }
    const token = jwt.sign(
        {
            role: "admin"
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d"
        }
    );
    res.json({
        message: "Login success",
        token
    });
};