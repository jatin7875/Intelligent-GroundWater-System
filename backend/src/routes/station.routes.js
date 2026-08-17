import { Router } from "express";
import * as stationController from "../controllers/station.controller.js";

const router = Router();

router.get("/", stationController.getStations);
router.get("/:stationId", stationController.getStation);
router.get("/:stationId/readings", stationController.getReadings);
router.get("/:stationId/recharge", stationController.getRecharge);

router.get("/:stationId/forecast", stationController.getForecast);
router.post("/:stationId/recharge", stationController.calculateRecharge);
router.post("/:stationId/classify", stationController.classifyStation);
router.post("/:stationId/anomalies", stationController.detectAnomalies);
router.post("/:stationId/gap-fill", stationController.fillGaps);

export default router;
