import { Router } from "express";
import * as districtController from "../controllers/district.controller.js";

const router = Router();

router.get("/", districtController.getDistricts);

export default router;
