import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { AuthenticateJwtMiddleware } from "../middlewares/auth.middleware";
import { verifyUserId } from "../middlewares/verifyUserId.middleware";
import { getUserById } from "../middlewares/getUserById.middleware";
import { deleteBookByBookId } from "../middlewares/deleteBookByBookId.middleware";
import { verifyUserAndBooking } from "../middlewares/purchasing.middleware";
import { verifyPurchaseOwnership } from "../middlewares/verifyPurchaseOwnership.middleware";
import { verifyReviewEligibility } from "../middlewares/verifyReviewEligibility.middleware";
import { isAuthenticatedForBookedList } from "../middlewares/isAuthenticatedForBookedList.middleware";

const router = Router();
const userController = new UserController();
const authenticateJwt = new AuthenticateJwtMiddleware();

router.post("/users", userController.createUser.bind(userController));

router.get("/reviews", userController.getReviews.bind(userController));

router.get("/search", userController.searchEvents.bind(userController));

router.get("/events", userController.searchEvents.bind(userController));

// Route for fetching all booked events by user
router.get(
	"/user/booked-events/:userId",
	authenticateJwt.authenticateJwt.bind(authenticateJwt),
	authenticateJwt.authorizeRole("user").bind(authenticateJwt),
	isAuthenticatedForBookedList, //make middleware to make sure that only logged users are allowed to access this.
	userController.getAllBookedEventsByUser.bind(userController)
);
//Route for booking an event
router.post(
	"/book-event",
	authenticateJwt.authenticateJwt.bind(authenticateJwt),
	authenticateJwt.authorizeRole("user").bind(authenticateJwt),
	verifyUserId, 
	userController.bookEvent.bind(userController)
);

//Route for booking an event without points
router.post(
	"/book-eventWihoutPoints",
	authenticateJwt.authenticateJwt.bind(authenticateJwt),
	authenticateJwt.authorizeRole("user").bind(authenticateJwt),
	verifyUserId, 
	userController.bookEventWithoutPoints.bind(userController)
);

//Route to delete booking
router.delete(
	"/book-event/:bookingId",
	authenticateJwt.authenticateJwt.bind(authenticateJwt),
	authenticateJwt.authorizeRole("user").bind(authenticateJwt),
	deleteBookByBookId,
	userController.deleteBooking.bind(userController)
);

//Route for getting userId
router.get(
	"/user/:userId",
	authenticateJwt.authenticateJwt.bind(authenticateJwt),
	authenticateJwt.authorizeRole("user").bind(authenticateJwt),
	getUserById,
	userController.getUserById.bind(userController)
);

//Route for purchasing an event
router.post(
	"/purchase-event",
	authenticateJwt.authenticateJwt.bind(authenticateJwt),
	authenticateJwt.authorizeRole("user").bind(authenticateJwt),
	verifyUserId,
	userController.purchaseEvent.bind(userController)
);

//Route for getting purchase by Id
router.get(
	"/payment/:paymentId",
	authenticateJwt.authenticateJwt.bind(authenticateJwt),
	authenticateJwt.authorizeRole("user").bind(authenticateJwt),
	verifyPurchaseOwnership, // Ensure ownership of the purchase if needed
	userController.getPurchaseById.bind(userController)
);

router.post(
	"/review",
	authenticateJwt.authenticateJwt.bind(authenticateJwt),
	authenticateJwt.authorizeRole("user").bind(authenticateJwt),
	verifyReviewEligibility,
	userController.addReview.bind(userController)
);

export default router;
