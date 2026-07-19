import db from '../config/db.js'
export const createProject = async (req , res)=>{
    try{
        const {
            projectName,
            businessType,
            projectDescription,
            platform,
            design,
            requirements,
            fullName,
            email,
            phone,
            refCode
        }=req.body
        const [clients] = await db.query(
            `SELECT id FROM clients WHERE email=?`,
            [email]
        )
        let marketerId = null;
        if(refCode){
            const [marketers] = await db.query(
                'SELECT id FROM marketers WHERE ref_code = ?',
                [refCode]
            )
            if(marketers.length > 0){
                marketerId = marketers[0].id
            }
        }
        let clientId ; 
        if(clients.length > 0){
            console.log('Client exists')
            clientId = clients[0].id
        }else{
            console.log('New client')
            const [result] = await db.query(
                'INSERT INTO clients (full_name , email ,phone) VALUES (?,?,?)',
                [fullName , email ,phone]
            )
            clientId = result.insertId;
        }
        await db.query(
        `INSERT INTO projects (
            client_id,
            project_name,
            business_type,
            project_description,
            platform,
            design,
            requirements,
            marketer_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?,?)`,
        [
            clientId,
            projectName,
            businessType,
            projectDescription,
            platform,
            design,
            requirements,
            marketerId
        ]
    );
        res.status(201).json({message : 'added successfully '})

    }catch(err){
        console.error(err)
        res.status(500).json({error : 'opps server error .'})
    }

};
export const getProjects = async (req,res)=>{
    try{
        const [rows] = await db.execute(`
            SELECT 
            projects.*,
            clients.full_name,
            clients.email,
            clients.phone,
            marketers.full_name AS marketer_name,
            marketers.ref_code
            FROM projects
            JOIN clients 
                ON projects.client_id = clients.id
            LEFT JOIN marketers 
                ON projects.marketer_id = marketers.id
                ORDER BY projects.created_at DESC`
            );
            res.json(rows);
    }catch(err){
        console.error(err)
        res.status(500).json({
            message : 'Server Error'
        });
    }
};

export const updateProjectStatus = async (req, res) => {

    try {

        const { id } = req.params;
        const { status } = req.body;
        const [[oldProject]] = await db.execute(
            `
            SELECT status, marketer_id, price
            FROM projects
            WHERE id = ?
            `,
            [id]
        );

        if (!oldProject) {
            return res.status(404).json({
                message: "Project not found"
            });
        }
        await db.execute(
            `
            UPDATE projects
            SET status = ?
            WHERE id = ?
            `,
            [status, id]
        );

        if (
            oldProject.status !== "paid" &&
            status === "paid"
        ) {
            if (oldProject.marketer_id) {
                const commission =
                    oldProject.price *
                    Number(process.env.COMMISSION_RATE);
                await db.execute(
                    `
                    UPDATE marketers
                    SET
                        sales = sales + 1,
                        points = points + 10,
                        balance = balance + ?
                    WHERE id = ?
                    `,
                    [
                        commission,
                        oldProject.marketer_id
                    ]
                );
            }
        }
        res.json({
            message: "Status updated successfully"
        });

    } catch (err) {

        console.error(err)
        res.status(500).json({
            message: "Server Error"
        });
    }
};
export const updatProjectPrice = async (req, res) => {
    try {
        const { id } = req.params;
        const { price } = req.body;
        const [[project]] = await db.query(
            `SELECT price, status, marketer_id
             FROM projects
             WHERE id = ?`,
            [id]
        );
        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }
        await db.execute(
            `UPDATE projects
             SET price = ?
             WHERE id = ?`,
            [price, id]
        );
        if (
            project.status === "paid" &&
            project.marketer_id
        ) {
            const rate =Number(process.env.COMMISSION_RATE);
            const oldCommission= Number(project.price) * rate;
            const newCommission =Number(price) * rate;
            const difference =
                newCommission - oldCommission;
            await db.execute(
                `UPDATE marketers
                SET balance = balance + ?
                WHERE id = ?`,
                [
                    difference,
                    project.marketer_id
                ]
            );
        }
        res.json({
            message: "Price updated successfully"
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Server Error"
        });
    }
};
export const getDashboardStats = async (req , res)=>{
    try{
        const [[projects]] = await db.query(
            'SELECT COUNT(*) AS totalProjects FROM projects'
        );
        const [[clients]] = await db.query(
            'SELECT COUNT(*) AS totalClients FROM clients'
        );
        const [[marketer]] = await db.query(
            "SELECT COUNT(*) AS totalMarketers FROM marketers"
        )
        const [[revenue]] = await db.query(`
            SELECT IFNULL(SUM(price),0) AS totalRevenue
            FROM projects
            WHERE status='paid'`)
        res.json({
            totalProjects : projects.totalProjects,
            totalClients : clients.totalClients,
            totalMarketers : marketer.totalMarketers,
            totalRevenue : revenue.totalRevenue
        })
    }catch(err){
        console.error(err);
        res.status(500).json({
            message : 'Server Error'
        })
    }
}
export const getProject = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query(
            `SELECT
                projects.*,
                clients.full_name,
                clients.email,
                clients.phone,
                marketers.full_name AS marketer_name,
                marketers.ref_code
            FROM projects
            JOIN clients
                ON projects.client_id = clients.id
            LEFT JOIN marketers
                ON projects.marketer_id = marketers.id
            WHERE projects.id = ?`,
            [id]
        );
        if (rows.length === 0) {
            return res.status(404).json({
                message: "Project not found"
            });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Server Error"
        });
    }
};
export const getMarketers = async (req, res) => {
    try {
        const [rows] = await db.query(`
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
            ORDER BY created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Server Error"
        });
    }

};
export const getMarketerProjects = async (req, res) => {
    console.log("USER =", req.user);
    try {
        const marketerId = req.user.id;
        const [rows] = await db.query(`
            SELECT
                id,
                project_name,
                status,
                price,
                created_at
            FROM projects
            WHERE marketer_id = ?
            ORDER BY created_at DESC
        `,[marketerId]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Server Error"
        });
    }
};
export const getLeaderboard = async (req, res) => {

    try {

        const [rows] = await db.query(`
            SELECT
                full_name,
                visitors,
                sales,
                points,
                balance
            FROM marketers
            ORDER BY points DESC
        `);

        res.json(rows);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            message: "Server Error"
        });

    }

};
