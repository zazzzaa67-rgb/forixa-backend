import bcrypt from 'bcrypt';
import supabase from '../config/supabase.js'
import jwt from "jsonwebtoken";
console.log("AUTH CONTROLLER LOADED");
export const marketer = async(req , res)=>{
    try{
        const {fullName , email , password } = req.body
        const hashedPassword = await bcrypt.hash(password, 10)
        const refCode = Math.random().toString(36).substring(2,10).toUpperCase()
        const { data, error } = await supabase
            .from("marketers")
            .insert({
                full_name: fullName,
                email,
                password: hashedPassword,
                ref_code: refCode
            })
            .select()
            .single();
        if (error) {
            console.error(error);
            return res.status(500).json({
                message: "Failed to create marketer"
            });
        }
        res.status(201).json({
            message: 'Marketer created successfully',
            marketer:{
                marketerId: data.id,
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
        const { data: marketer, error } = await supabase
            .from("marketers")
            .select("*")
            .eq("email", email)
            .single();
        if (error || !marketer) {
            return res.status(404).json({
                message: "Email Not found"
            });
        }
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
    const { data: marketer, error } = await supabase
        .from("marketers")
        .select(`
            id,
            full_name,
            email,
            ref_code,
            visitors,
            sales,
            points,
            balance
        `)
        .eq("id", req.user.id)
        .single();

    if (error) {
        console.error(error);

        return res.status(500).json({
            message: "Server Error"
        });
    }
    res.json(marketer);
};
export const logout = (req, res) => {
    res.json({
        message: "Logged out"
    });
};
export const addVisitor = async (req, res) => {
    try {
        const { refCode } = req.body;
        // 1. Find marketer
        const { data: marketer, error: findError } =
            await supabase
                .from("marketers")
                .select("id, visitors")
                .eq("ref_code", refCode)
                .single();

        if (findError) {
            console.error(findError);

            return res.status(500).json({
                message: "Failed to find marketer"
            });
        }

        if (!marketer) {
            return res.status(404).json({
                message: "Marketer not found"
            });
        }
        // 2. Increase visitors
        const { error: updateError } =
            await supabase
                .from("marketers")
                .update({
                    visitors: Number(marketer.visitors) + 1
                })
                .eq("id", marketer.id);
        if (updateError) {
            console.error(updateError);
            return res.status(500).json({
                message: "Failed to update visitors"
            });
        }
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