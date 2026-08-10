import supabase from "../config/supabase.js";
export const createProject = async (req, res) => {
    try {
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
        } = req.body;

        // 1. Find client
        const { data: existingClient, error: clientSearchError } =
            await supabase
                .from("clients")
                .select("id")
                .eq("email", email)
                .maybeSingle();

        if (clientSearchError) {
            console.error(clientSearchError);
            return res.status(500).json({
                message: "Failed to find client"
            });
        }

        // 2. Find marketer
        let marketerId = null;

        if (refCode) {
            const { data: marketer, error: marketerError } =
                await supabase
                    .from("marketers")
                    .select("id")
                    .eq("ref_code", refCode)
                    .maybeSingle();

            if (marketerError) {
                console.error(marketerError);
                return res.status(500).json({
                    message: "Failed to find marketer"
                });
            }

            if (marketer) {
                marketerId = marketer.id;
            }
        }

        // 3. Create client if doesn't exist
        let clientId;

        if (existingClient) {
            console.log("Client exists");
            clientId = existingClient.id;
        } else {
            console.log("New client");

            const { data: newClient, error: createClientError } =
                await supabase
                    .from("clients")
                    .insert({
                        full_name: fullName,
                        email,
                        phone
                    })
                    .select("id")
                    .single();

            if (createClientError) {
                console.error(createClientError);
                return res.status(500).json({
                    message: "Failed to create client"
                });
            }

            clientId = newClient.id;
        }

        // 4. Create project
        const { error: projectError } = await supabase
            .from("projects")
            .insert({
                client_id: clientId,
                project_name: projectName,
                business_type: businessType,
                project_description: projectDescription,
                platform,
                design,
                requirements,
                marketer_id: marketerId
            });

        if (projectError) {
            console.error(projectError);
            return res.status(500).json({
                message: "Failed to create project"
            });
        }
        res.status(201).json({
            message: "added successfully"
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Oops server error."
        });
    }
};
export const getProjects = async (req,res)=>{
            const {data , error} = await supabase
            .from('projects')
            .select(`
            *,
            clients(
            full_name,
            email,
            phone
            ),
            marketers(
            full_name,
            ref_code
            )
                `)
            .order("created_at", { ascending: false })
            if (error) {
                console.error(error);
                return res.status(500).json({
                    message: "Server Error"
                });
            }
            res.json(data);
    }
;

export const updateProjectStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // 1. Get old project
        const { data: oldProject, error: projectError } =
            await supabase
                .from("projects")
                .select("status, marketer_id, price")
                .eq("id", id)
                .single();

        if (projectError) {
            console.error(projectError);
            return res.status(500).json({
                message: "Failed to get project"
            });
        }

        if (!oldProject) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        // 2. Update project status
        const { error: updateError } = await supabase
            .from("projects")
            .update({
                status: status
            })
            .eq("id", id);

        if (updateError) {
            console.error(updateError);
            return res.status(500).json({
                message: "Failed to update project status"
            });
        }

        // 3. If project became paid for the first time
        if (
            oldProject.status !== "paid" &&
            status === "paid"
        ) {
            if (oldProject.marketer_id) {

                const commission =
                    Number(oldProject.price) *
                    Number(process.env.COMMISSION_RATE);

                // Get marketer
                const { data: marketer, error: marketerError } =
                    await supabase
                        .from("marketers")
                        .select("sales, points, balance")
                        .eq("id", oldProject.marketer_id)
                        .single();

                if (marketerError) {
                    console.error(marketerError);
                    return res.status(500).json({
                        message: "Failed to find marketer"
                    });
                }

                // Update marketer
                const { error: updateMarketerError } =
                    await supabase
                        .from("marketers")
                        .update({
                            sales: marketer.sales + 1,
                            points: marketer.points + 10,
                            balance: Number(marketer.balance) + commission
                        })
                        .eq("id", oldProject.marketer_id);
                if (updateMarketerError) {
                    console.error(updateMarketerError);
                    return res.status(500).json({
                        message: "Failed to update marketer"
                    });
                }
            }
        }
        res.json({
            message: "Status updated successfully"
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Server Error"
        });
    }
};
export const updatProjectPrice = async (req, res) => {
    try {
        const { id } = req.params;
        const { price } = req.body;
        // 1. Get old project
        const { data: project, error: projectError } =
            await supabase
                .from("projects")
                .select("price, status, marketer_id")
                .eq("id", id)
                .single();

        if (projectError) {
            console.error(projectError);
            return res.status(500).json({
                message: "Failed to get project"
            });
        }

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }
        // 2. Update project price
        const { error: updateError } =
            await supabase
                .from("projects")
                .update({
                    price: price
                })
                .eq("id", id);

        if (updateError) {
            console.error(updateError);
            return res.status(500).json({
                message: "Failed to update project price"
            });
        }
        // 3. Update marketer commission if project is already paid
        if (
            project.status === "paid" &&
            project.marketer_id
        ) {
            const rate =
                Number(process.env.COMMISSION_RATE);

            const oldCommission =
                Number(project.price) * rate;

            const newCommission =
                Number(price) * rate;

            const difference =
                newCommission - oldCommission;

            // Get marketer
            const { data: marketer, error: marketerError } =
                await supabase
                    .from("marketers")
                    .select("balance")
                    .eq("id", project.marketer_id)
                    .single();
            if (marketerError) {
                console.error(marketerError);
                return res.status(500).json({
                    message: "Failed to find marketer"
                });
            }
            // Update marketer balance
            const { error: updateMarketerError } =
                await supabase
                    .from("marketers")
                    .update({
                        balance:
                            Number(marketer.balance) +
                            difference
                    })
                    .eq("id", project.marketer_id);
            if (updateMarketerError) {
                console.error(updateMarketerError);
                return res.status(500).json({
                    message: "Failed to update marketer balance"
                });
            }
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
export const getDashboardStats = async (req, res) => {
    try {

        // 1. Total Projects
        const { count: totalProjects, error: projectsError } =
            await supabase
                .from("projects")
                .select("*", { count: "exact", head: true });

        if (projectsError) {
            console.error(projectsError);
            return res.status(500).json({
                message: "Failed to get projects count"
            });
        }

        // 2. Total Clients
        const { count: totalClients, error: clientsError } =
            await supabase
                .from("clients")
                .select("*", { count: "exact", head: true });

        if (clientsError) {
            console.error(clientsError);
            return res.status(500).json({
                message: "Failed to get clients count"
            });
        }

        // 3. Total Marketers
        const { count: totalMarketers, error: marketersError } =
            await supabase
                .from("marketers")
                .select("*", { count: "exact", head: true });

        if (marketersError) {
            console.error(marketersError);
            return res.status(500).json({
                message: "Failed to get marketers count"
            });
        }

        // 4. Total Revenue
        const { data: paidProjects, error: revenueError } =
            await supabase
                .from("projects")
                .select("price")
                .eq("status", "paid");
        if (revenueError) {
            console.error(revenueError);
            return res.status(500).json({
                message: "Failed to get revenue"
            });
        }

        const totalRevenue = paidProjects.reduce(
            (total, project) =>
                total + Number(project.price || 0),
            0
        );

        res.json({
            totalProjects,
            totalClients,
            totalMarketers,
            totalRevenue
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            message: "Server Error"
        });
    }
};
export const getProject = async (req, res) => {
    try {
        const { id } = req.params;
        const {data , error} = await supabase
        .from('projects')
        .select(`
            *,
            clients (
            full_name,
            email,
            phone
            ),
            marketers(
            full_name,
            ref_code)`)
            .eq('id' , id)
            .single()
        if (!data) {
            return res.status(404).json({
                message: "Project not found"
            });
        }
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Server Error"
        });
    }
};
export const getMarketers = async (req, res) => {
    try {
        const {data , error} = await supabase
        .from('marketers')
        .select(        `
                id,
                full_name,
                email,
                ref_code,
                visitors,
                sales,
                points,
                balance
        `)
        .order("created_at", { ascending: false });
        if(error){
            console.error(error)
            return res.status(500).json({
                message : 'Server Error'
            })
        }
        res.json(data);
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
        const {data , error} = await supabase
        .from('projects')
        .select(`
                id,
                project_name,
                status,
                price,
                created_at
            `
        )
        .eq('marketer_id',marketerId )
        .order('created_at' , {ascending : false})
        if(error){
            console.error(error)
            res.status(500).json({
                message :'Server Error'
            })
        }
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Server Error"
        });
    }
};
export const getLeaderboard = async (req, res) => {
    try {
        const {data , error} = await supabase
        .from('marketers')
        .select(`
                full_name,
                visitors,
                sales,
                points,
                balance
            `)
            .order('points' , {ascending:false})
            if(error){
                console.error(error)
                res.status(500).json({
                    message :'server Error'
            })
            }
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Server Error"
        });
    }
};
