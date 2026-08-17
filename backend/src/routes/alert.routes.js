import { Router } from "express";
import * as alertController from "../controllers/alert.controller.js";

const router = Router();

router.get("/", alertController.getAlerts);

export default router;
