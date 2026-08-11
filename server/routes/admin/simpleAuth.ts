import { Router } from "express";
import {
  tempAdminAuthMiddleware,
  type AdminRequest,
} from "../../middleware/tempAdminAuth";

const router = Router();

router.post("/simple-login", (_req, res) => {
  return res.status(410).json({
    error: "Legacy admin login is disabled. Use /api/admin/auth/login.",
  });
});

router.get("/validate", tempAdminAuthMiddleware, (req: AdminRequest, res) => {
  if (!req.admin) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  return res.json({ admin: req.admin });
});

export default router;
