import * as mlOrchestratorService from "../services/mlOrchestrator.service.js";
import prisma from "../config/database.js";

/**
 * Controller to handle REST requests for station ML analyses.
 * Delegates all data logic to the Orchestrator service.
 */

/**
 * GET /stations/:stationId/forecast
 */
export const getForecast = async (req, res) => {
  const { stationId } = req.params;
  const horizonDays = req.query.horizonDays ? Number(req.query.horizonDays) : undefined;
  const freq = req.query.freq || undefined;

  const requestStartTime = Date.now();
  console.log(`[ML Integration] GET /stations/${stationId}/forecast requested`);

  try {
    const result = await mlOrchestratorService.orchestrateForecast(
      stationId,
      horizonDays,
      freq
    );

    const totalTime = Date.now() - requestStartTime;
    console.log(`[ML Integration] Forecast endpoint completed in ${totalTime}ms (FastAPI: ${result.mlDurationMs}ms, DB: ${result.dbSaveTimeMs}ms)`);

    return res.status(200).json({
      success: true,
      data: {
        mae: result.mae,
        rmse: result.rmse,
        forecast: result.forecast,
      },
      metrics: {
        mlExecutionTimeMs: result.mlDurationMs,
        dbSaveTimeMs: result.dbSaveTimeMs,
        totalRequestTimeMs: totalTime,
      },
    });
  } catch (error) {
    const totalTime = Date.now() - requestStartTime;
    console.error(`[ML Integration Error] Forecast handler failed after ${totalTime}ms:`, error.message);

    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to process forecasting request.",
      details: error.data || null,
    });
  }
};

/**
 * POST /stations/:stationId/recharge
 */
export const calculateRecharge = async (req, res) => {
  const { stationId } = req.params;

  const requestStartTime = Date.now();
  console.log(`[ML Integration] POST /stations/${stationId}/recharge requested`);

  try {
    const result = await mlOrchestratorService.orchestrateRecharge(stationId);
    const totalTime = Date.now() - requestStartTime;

    console.log(`[ML Integration] Recharge endpoint completed in ${totalTime}ms (FastAPI: ${result.mlDurationMs}ms, DB: ${result.dbSaveTimeMs}ms)`);

    return res.status(200).json({
      success: true,
      data: {
        yearly: result.yearly,
      },
      metrics: {
        mlExecutionTimeMs: result.mlDurationMs,
        dbSaveTimeMs: result.dbSaveTimeMs,
        totalRequestTimeMs: totalTime,
      },
    });
  } catch (error) {
    const totalTime = Date.now() - requestStartTime;
    console.error(`[ML Integration Error] Recharge handler failed after ${totalTime}ms:`, error.message);

    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to calculate groundwater recharge.",
      details: error.data || null,
    });
  }
};

/**
 * POST /stations/:stationId/classify
 */
export const classifyStation = async (req, res) => {
  const { stationId } = req.params;

  const requestStartTime = Date.now();
  console.log(`[ML Integration] POST /stations/${stationId}/classify requested`);

  try {
    const result = await mlOrchestratorService.orchestrateClassification(stationId);
    const totalTime = Date.now() - requestStartTime;

    console.log(`[ML Integration] Classification endpoint completed in ${totalTime}ms (FastAPI: ${result.mlDurationMs}ms)`);

    return res.status(200).json({
      success: true,
      data: {
        stage_of_extraction_pct: result.stage_of_extraction_pct,
        classification: result.classification,
        recharge_m3: result.recharge_m3,
        annual_extraction_m3: result.annual_extraction_m3,
        year: result.year,
      },
      metrics: {
        mlExecutionTimeMs: result.mlDurationMs,
        totalRequestTimeMs: totalTime,
      },
    });
  } catch (error) {
    const totalTime = Date.now() - requestStartTime;
    console.error(`[ML Integration Error] Classification handler failed after ${totalTime}ms:`, error.message);

    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to perform groundwater classification.",
      details: error.data || null,
    });
  }
};

/**
 * POST /stations/:stationId/anomalies
 */
export const detectAnomalies = async (req, res) => {
  const { stationId } = req.params;
  const freq = req.query.freq || undefined;

  const requestStartTime = Date.now();
  console.log(`[ML Integration] POST /stations/${stationId}/anomalies requested`);

  try {
    const result = await mlOrchestratorService.orchestrateAnomalies(stationId, freq);
    const totalTime = Date.now() - requestStartTime;

    console.log(`[ML Integration] Anomalies endpoint completed in ${totalTime}ms (FastAPI: ${result.mlDurationMs}ms)`);

    return res.status(200).json({
      success: true,
      data: {
        anomalies: result.anomalies,
      },
      metrics: {
        mlExecutionTimeMs: result.mlDurationMs,
        totalRequestTimeMs: totalTime,
      },
    });
  } catch (error) {
    const totalTime = Date.now() - requestStartTime;
    console.error(`[ML Integration Error] Anomalies handler failed after ${totalTime}ms:`, error.message);

    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to run anomaly detection.",
      details: error.data || null,
    });
  }
};

/**
 * POST /stations/:stationId/gap-fill
 */
export const fillGaps = async (req, res) => {
  const { stationId } = req.params;
  const freq = req.query.freq || undefined;

  const requestStartTime = Date.now();
  console.log(`[ML Integration] POST /stations/${stationId}/gap-fill requested`);

  try {
    const result = await mlOrchestratorService.orchestrateGapFill(stationId, freq);
    const totalTime = Date.now() - requestStartTime;

    console.log(`[ML Integration] Gap-fill endpoint completed in ${totalTime}ms (FastAPI: ${result.mlDurationMs}ms)`);

    return res.status(200).json({
      success: true,
      data: {
        readings: result.readings,
      },
      metrics: {
        mlExecutionTimeMs: result.mlDurationMs,
        totalRequestTimeMs: totalTime,
      },
    });
  } catch (error) {
    const totalTime = Date.now() - requestStartTime;
    console.error(`[ML Integration Error] Gap-fill handler failed after ${totalTime}ms:`, error.message);

    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to fill timeseries data gaps.",
      details: error.data || null,
    });
  }
};

/**
 * GET /stations
 * Fetch and format all stations.
 */
export const getStations = async (req, res) => {
  try {
    const stations = await prisma.station.findMany({
      include: {
        aquiferType: true,
        assessmentUnit: {
          include: {
            assessments: {
              orderBy: { year: "desc" },
              take: 1,
            },
          },
        },
        readings: {
          orderBy: { timestamp: "desc" },
          take: 2,
        },
        rechargeResults: {
          orderBy: { periodEnd: "desc" },
          take: 1,
        },
      },
    });

    const formattedStations = stations.map((station) => {
      const currentReading = station.readings[0];
      const previousReading = station.readings[1];
      const latestAssessment = station.assessmentUnit?.assessments?.[0];
      const latestRecharge = station.rechargeResults[0];

      const stationCode = `ST-${station.id.slice(0, 5).toUpperCase()}`;

      let trend = "stable";
      if (currentReading && previousReading) {
        const diff = currentReading.rawWaterLevel - previousReading.rawWaterLevel;
        if (diff > 0.05) trend = "falling";
        else if (diff < -0.05) trend = "rising";
      }

      const qualityScore = currentReading ? 100 : 0;
      const confidence = currentReading ? "High" : "Low";

      return {
        id: station.id,
        stationCode,
        name: station.stationName,
        state: station.state,
        district: station.district,
        block: station.block || `${station.district} Rural`,
        village: station.village || "N/A",
        latitude: station.latitude,
        longitude: station.longitude,
        elevation: station.rlMsl,
        agency: station.agency,
        aquiferType: station.aquiferType?.name || null,
        status: station.isActive ? "active" : "inactive",
        classification: latestAssessment?.category?.toLowerCase().replace('_', '-') || "unknown",
        trend,
        currentWaterLevel: currentReading ? Number(currentReading.rawWaterLevel.toFixed(2)) : 0.0,
        previousWaterLevel: previousReading ? Number(previousReading.rawWaterLevel.toFixed(2)) : 0.0,
        rechargeEstimate: latestRecharge ? Number(latestRecharge.recharge.toFixed(2)) : latestAssessment ? Number((latestAssessment.annualRecharge).toFixed(2)) : 0.0,
        lastUpdated: currentReading ? currentReading.timestamp.toISOString() : station.updatedAt.toISOString(),
        dataQualityScore: qualityScore,
        dataConfidence: confidence,
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedStations,
    });
  } catch (error) {
    console.error("Failed to fetch stations:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch stations",
      details: error.message,
    });
  }
};

/**
 * GET /stations/:stationId
 * Fetch details of a single station.
 */
export const getStation = async (req, res) => {
  const { stationId } = req.params;
  try {
    const station = await prisma.station.findUnique({
      where: { id: stationId },
      include: {
        aquiferType: true,
        assessmentUnit: {
          include: {
            assessments: {
              orderBy: { year: "desc" },
              take: 1,
            },
          },
        },
        readings: {
          orderBy: { timestamp: "desc" },
          take: 2,
        },
        rechargeResults: {
          orderBy: { periodEnd: "desc" },
          take: 1,
        },
      },
    });

    if (!station) {
      return res.status(404).json({
        success: false,
        message: "Station not found",
      });
    }

    const currentReading = station.readings[0];
    const previousReading = station.readings[1];
    const latestAssessment = station.assessmentUnit?.assessments?.[0];
    const latestRecharge = station.rechargeResults[0];

    const stationCode = `ST-${station.id.slice(0, 5).toUpperCase()}`;

    let trend = "stable";
    if (currentReading && previousReading) {
      const diff = currentReading.rawWaterLevel - previousReading.rawWaterLevel;
      if (diff > 0.05) trend = "falling";
      else if (diff < -0.05) trend = "rising";
    }

    const qualityScore = currentReading ? 100 : 0;
    const confidence = currentReading ? "High" : "Low";

    const formattedStation = {
      id: station.id,
      stationCode,
      name: station.stationName,
      state: station.state,
      district: station.district,
      block: station.block || `${station.district} Rural`,
      village: station.village || "N/A",
      latitude: station.latitude,
      longitude: station.longitude,
      elevation: station.rlMsl,
      agency: station.agency,
      aquiferType: station.aquiferType?.name || null,
      status: station.isActive ? "active" : "inactive",
      classification: latestAssessment?.category?.toLowerCase().replace('_', '-') || "unknown",
      trend,
      currentWaterLevel: currentReading ? Number(currentReading.rawWaterLevel.toFixed(2)) : 0.0,
      previousWaterLevel: previousReading ? Number(previousReading.rawWaterLevel.toFixed(2)) : 0.0,
      rechargeEstimate: latestRecharge ? Number(latestRecharge.recharge.toFixed(2)) : latestAssessment ? Number((latestAssessment.annualRecharge).toFixed(2)) : 0.0,
      lastUpdated: currentReading ? currentReading.timestamp.toISOString() : station.updatedAt.toISOString(),
      dataQualityScore: qualityScore,
      dataConfidence: confidence,
    };

    return res.status(200).json({
      success: true,
      data: formattedStation,
    });
  } catch (error) {
    console.error("Failed to fetch station details:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch station details",
      details: error.message,
    });
  }
};

/**
 * GET /stations/:stationId/readings
 * Fetch time-series readings for a single station.
 */
export const getReadings = async (req, res) => {
  const { stationId } = req.params;
  try {
    const readings = await prisma.groundwaterReading.findMany({
      where: { stationId },
      orderBy: { timestamp: "asc" },
    });

    const formattedReadings = readings.map((r) => {
      return {
        id: r.id,
        stationId: r.stationId,
        timestamp: r.timestamp.toISOString(),
        rawValue: r.isImputed ? null : Number(r.rawWaterLevel.toFixed(2)),
        cleanedValue: r.cleanedWaterLevel !== null ? Number(r.cleanedWaterLevel.toFixed(2)) : null,
        filledValue: r.cleanedWaterLevel !== null ? Number(r.cleanedWaterLevel.toFixed(2)) : Number(r.rawWaterLevel.toFixed(2)),
        isAnomaly: r.isAnomaly,
        isMissing: r.isImputed,
        isReconstructed: r.isImputed,
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedReadings,
    });
  } catch (error) {
    console.error("Failed to fetch readings:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch readings",
      details: error.message,
    });
  }
};

/**
 * GET /stations/:stationId/recharge
 * Fetch the latest recharge calculation result for a station.
 */
export const getRecharge = async (req, res) => {
  const { stationId } = req.params;
  try {
    let latestRecharge = await prisma.rechargeResult.findFirst({
      where: { stationId },
      orderBy: { periodEnd: "desc" },
    });

    // If no recharge results exist, run orchestrator on the fly
    if (!latestRecharge) {
      console.log(`[Recharge] No recharge results found for station ${stationId}. Calculating on-the-fly...`);
      try {
        await mlOrchestratorService.orchestrateRecharge(stationId);
        latestRecharge = await prisma.rechargeResult.findFirst({
          where: { stationId },
          orderBy: { periodEnd: "desc" },
        });
      } catch (calcError) {
        console.error("On-the-fly recharge calculation failed:", calcError.message);
      }
    }

    if (!latestRecharge) {
      return res.status(404).json({
        success: false,
        message: "No recharge records found or could be calculated for this station.",
      });
    }

    // Fetch station area details
    const station = await prisma.station.findUnique({
      where: { id: stationId },
      include: {
        assessmentUnit: {
          include: {
            assessments: {
              orderBy: { year: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    const area = station?.assessmentUnit?.assessments?.[0]?.area;
    // convert sqm to km2
    const aquiferArea = area ? Number((area / 1000000).toFixed(2)) : 12.5;

    const formattedRecharge = {
      id: latestRecharge.id,
      stationId: latestRecharge.stationId,
      periodStart: latestRecharge.periodStart.toISOString().split("T")[0],
      periodEnd: latestRecharge.periodEnd.toISOString().split("T")[0],
      aquiferArea,
      waterLevelFluctuation: Number(latestRecharge.deltaWaterLevel.toFixed(2)),
      specificYield: latestRecharge.specificYield,
      rechargeValue: Number(latestRecharge.recharge.toFixed(2)),
      calculationMethod: "WTF",
      calculatedAt: latestRecharge.createdAt.toISOString(),
    };

    return res.status(200).json({
      success: true,
      data: formattedRecharge,
    });
  } catch (error) {
    console.error("Failed to fetch recharge details:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch recharge details",
      details: error.message,
    });
  }
};





