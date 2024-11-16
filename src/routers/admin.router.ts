import { Router } from "express";
import { AdminController } from "../controllers/admin.controller";
import { AuthenticateJwtMiddleware } from "../middlewares/auth.middleware";
import upload from "../middlewares/upload.middleware";
import { getUserById } from "../middlewares/getUserById.middleware";
import { verifyAdminToken } from "../middlewares/verifyAdminToken";

const router = Router();
const adminController = new AdminController();
const authenticateJwt = new AuthenticateJwtMiddleware();

router.post(
	"/events",
	authenticateJwt.authenticateJwt.bind(authenticateJwt),
	authenticateJwt.authorizeRole("admin").bind(authenticateJwt),
	upload.single("image"),
	verifyAdminToken,
	adminController.createEvent.bind(adminController)
);

router.get(
	"/events",
	authenticateJwt.authenticateJwt.bind(authenticateJwt),
	authenticateJwt.authorizeRole("admin").bind(authenticateJwt),
	adminController.getEvents.bind(adminController)
);

router.get(
	"/events/:id",
	authenticateJwt.authenticateJwt.bind(authenticateJwt),
	authenticateJwt.authorizeRole("admin").bind(authenticateJwt),
	adminController.getEventsById.bind(adminController)
);

router.put(
	"/events/:id",
	authenticateJwt.authenticateJwt.bind(authenticateJwt),
	authenticateJwt.authorizeRole("admin").bind(authenticateJwt),
	upload.single("image"),
	verifyAdminToken,
	adminController.updateEvent.bind(adminController)
);

router.delete(
	"/events/:id",
	authenticateJwt.authenticateJwt.bind(authenticateJwt),
	authenticateJwt.authorizeRole("admin").bind(authenticateJwt),
	verifyAdminToken,
	adminController.deleteEvent.bind(adminController)
);

router.get(
	"/purchases",
	authenticateJwt.authenticateJwt.bind(authenticateJwt),
	authenticateJwt.authorizeRole("admin").bind(authenticateJwt),
	getUserById,
	adminController.getAllPurchase.bind(adminController)
);

router.get(
	"/statistics/monthly",
	authenticateJwt.authenticateJwt.bind(authenticateJwt),
	authenticateJwt.authorizeRole("admin").bind(authenticateJwt),
	adminController.getMonthlyStatistics.bind(adminController)
);

router.get(
	"/statistics/eventTypeCount",
	authenticateJwt.authenticateJwt.bind(authenticateJwt),
	authenticateJwt.authorizeRole("admin").bind(authenticateJwt),
	verifyAdminToken,
	adminController.getEventTypeCounts.bind(adminController)
);

router.get(
	"/statistics/totalUserCount",
	authenticateJwt.authenticateJwt.bind(authenticateJwt),
	authenticateJwt.authorizeRole("admin").bind(authenticateJwt),
	verifyAdminToken,
	adminController.getTotalUserCount.bind(adminController)
);

router.get(
	"/statistics/totalPaidAmount",
	authenticateJwt.authenticateJwt.bind(authenticateJwt),
	authenticateJwt.authorizeRole("admin").bind(authenticateJwt),
	verifyAdminToken,
	adminController.getTotalPaidAmount.bind(adminController)
);

export default router;
