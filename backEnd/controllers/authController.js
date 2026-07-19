import bcrypt from 'bcrypt';
import db from '../config/db.js'
import jwt from "jsonwebtoken";
console.log("AUTH CONTROLLER LOADED");
export const marketer = async(req , res)=>{
    try{
        const {fullName , email , password } = req.body
        const hashedPassword = await bcrypt.hash(password, 10)
        const refCode = Math.random().toString(36).substring(2,10).toUpperCase()
        const [result] = await db.query(`
            INSERT INTO marketers(full_name , email, password,ref_code)
            VALUES(?,?,?,?)`,
        [fullName , email , hashedPassword , refCode]);
        res.status(201).json({
            message: 'Marketer created successfully',
            marketer:{
                marketerId: result.insertId,
                fullName,
                email
            },
            visitors : 0 ,
            payment : 0,
            commission : 0 ,
            refCode
            
        }
    
    );

    }catch(err){
        console.error(err)
        res.status(500).json({
            message: 'server Error'
        })
    }
}
export const login = async (req , res) =>{
    console.log("LOGIN CONTROLLER RUNNING");
    try{
        const {email , password} = req.body;
        const [rows] = await db.query(
            'SELECT * FROM marketers WHERE email= ?',
            [email]
        );
        if(rows.length ===0 ){
            return res.status(404).json({
                message : "Email Not found"
            })
        }
        const marketer = rows[0];
        const match = await bcrypt.compare(
            password,
            marketer.password
        );
        if(!match){
            return res.status(401).json({
                message:"Wrong password"
            });
        }
        const token = jwt.sign(
            {
                id: marketer.id,
                email: marketer.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );
        console.log(token);
        res.json({
            message: "Login success",
            token,
            marketer: {
                id: marketer.id,
                full_name: marketer.full_name,
                email: marketer.email,
                refCode: marketer.ref_code,
                visitors: marketer.visitors,
                sales: marketer.sales,
                points: marketer.points,
                balance: marketer.balance
            }
        });

    }catch(err){
        console.error(err);
        res.status(500).json({
            message: "Server Error"
        });
    }
};

export const profile = async (req, res) => {

    try {

        const [rows] = await db.query(
            `
            SELECT
                id,
                full_name,
                email,
                ref_code,
                visitors,
                sales,
                points,
                balance
            FROM marketers
            WHERE id = ?
            `,
            [req.user.id]
        );

        res.json(rows[0]);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Server Error"
        });

    }

};
export const logout = (req, res) => {

    res.json({
        message: "Logged out"
    });

};
export const addVisitor = async (req, res) => {

    console.log("========== VISITOR ==========");
    console.log(req.body);

    try {

        const { refCode } = req.body;

        const [result] = await db.execute(`
            UPDATE marketers
            SET visitors = visitors + 1
            WHERE ref_code = ?
        `, [refCode]);

        console.log(result);

        res.json({
            message: "Visitor Counted"
        });

    } catch (err) {
    console.error(err);

    res.status(500).json({
        message: err.message
    });
}

};