console.log("PROJECT ROUTES UPDATED");
import express, { Router } from 'express';
import {createProject ,
        getProjects , 
        updateProjectStatus,
        updatProjectPrice,
        getDashboardStats,
        getProject,
        getMarketers,
        getMarketerProjects,
        getLeaderboard} from '../controllers/projectControllers.js'
import { isAdmin } from "../middleware/authMiddleware.js";
import {isAuthenticated} from '../middleware/authMiddleware.js'
const router = express.Router();
router.post("/", createProject);
router.get("/", isAdmin, getProjects);
router.get("/dashboard/stats", isAdmin, getDashboardStats);
router.get("/marketers", isAdmin, getMarketers);
router.get("/my-projects",isAuthenticated,getMarketerProjects);
router.get("/leaderboard", getLeaderboard);
router.get("/:id", isAdmin, getProject);
router.put("/:id/status", isAdmin, updateProjectStatus);
router.put("/:id/price", isAdmin, updatProjectPrice);
export default router