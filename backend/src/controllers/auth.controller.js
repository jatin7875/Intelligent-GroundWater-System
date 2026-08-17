import prisma from "../config/database.js";

/**
 * POST /api/auth/login
 * Simple mock login matching frontend expectation.
 */
export const login = async (req, res) => {
  const { identifier, role } = req.body;

  try {
    // Look up user by email/identifier or default/create if not found
    let user = await prisma.user.findFirst({
      where: {
        email: identifier,
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: identifier.split("@")[0] || "Demo User",
          email: identifier,
          passwordHash: "demo-hashed-password",
          role: (role || "RESEARCHER").toUpperCase(),
        },
      });
    }

    return res.status(200).json({
      success: true,
      token: "demo-jwt-token-string",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.toLowerCase(),
        organization: "JalDrishti Groundwater Division",
      },
    });
  } catch (error) {
    console.error("Login controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication failed",
      details: error.message,
    });
  }
};
