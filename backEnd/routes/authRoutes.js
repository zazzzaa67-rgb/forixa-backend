console.log("AUTH ROUTES FILE LOADED");
import express from 'express';
import {marketer , login , profile , logout , addVisitor} from '../controllers/authController.js'
import {isAuthenticated} from '../middleware/authMiddleware.js'

const router = express.Router()
router.post('/marketer' , marketer)
router.post('/login', login)
router.get('/profile' ,isAuthenticated,profile)
router.get('/logout' , isAuthenticated , logout)
router.post('/visitor' , addVisitor)
export default router;