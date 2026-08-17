import prisma from "../config/database.js";

/**
 * GET /api/alerts
 * Fetch and format alerts already recorded by the operational pipeline.
 */
export const getAlerts = async (req, res) => {
  try {
    let alerts = await prisma.alert.findMany({
      include: {
        station: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedAlerts = alerts.map((a) => {
      let type = "anomaly";
      if (a.title.toLowerCase().includes("decline")) type = "rapid-decline";
      else if (a.title.toLowerCase().includes("critical")) type = "category-change";
      else if (a.title.toLowerCase().includes("forecast")) type = "forecast-warning";
      else if (a.title.toLowerCase().includes("offline")) type = "sensor-offline";

      return {
        id: a.id,
        title: a.title,
        description: a.message,
        district: a.station.district,
        state: a.station.state,
        severity: a.severity.toLowerCase(),
        type,
        status: a.isResolved ? "Acknowledged" : "New",
        createdAt: a.createdAt.toISOString(),
        stationId: a.stationId,
        recommendedAction: a.severity === "CRITICAL" || a.severity === "HIGH"
          ? "Restrict non-essential pumping and verify field conditions."
          : "Review the latest readings and continue monitoring.",
        currentValue: "N/A",
        previousValue: "N/A",
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedAlerts,
    });
  } catch (error) {
    console.error("Failed to fetch alerts:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch alerts",
      details: error.message,
    });
  }
};
