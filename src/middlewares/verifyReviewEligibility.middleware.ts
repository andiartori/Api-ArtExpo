import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { DecodedTokenAdmin } from "../models/models";

const prisma = new PrismaClient();

interface RequestWithUser extends Request {
	user?: number; // user ID will be attached to the request object
}

export const verifyReviewEligibility = async (
	req: RequestWithUser, // Use RequestWithUser to type the request object
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const token = req.headers.authorization?.split(" ")[1];
		const { userId, paymentId } = req.body;

		// Check if token is present
		if (!token) {
			res.status(401).send({ message: "Access token is required" });
			return;
		}

		try {
			// Decode the token
			const decoded = jwt.verify(
				token,
				process.env.JWT_SECRET!
			) as DecodedTokenAdmin;
			console.log("Decoded token structure:", decoded);

			// Access the user ID from the token payload
			const decodedUserId = decoded.user;
			if (!decodedUserId) {
				console.log("No user field found in token payload.");
				res.status(403).send({ message: "User ID not found in token." });
				return;
			}

			// Ensure the user ID in token matches the one in request body
			if (decodedUserId !== userId) {
				res.status(403).send({ message: "User ID does not match the token." });
				return;
			}
		} catch (error) {
			console.error("Error verifying token:", error);
			res.status(401).send({ message: "Invalid access token" });
			return;
		}

		// Check if the payment exists and is associated with the user
		const payment = await prisma.payments.findUnique({
			where: { payment_id: Number(paymentId) },
			include: {
				booking: {
					include: {
						user: true,
						event: true,
					},
				},
			},
		});

		// Validate payment existence and association with user
		if (!payment) {
			res.status(404).send({ message: "Payment not found." });
			return;
		}

		if (payment.booking.user.user_id !== userId) {
			res.status(403).send({
				message: "You can only write a review for your own payment.",
			});
			return;
		}

		// Check if the event status is "completed"
		if (payment.booking.event.event_type.toLowerCase() !== "completed") {
			res.status(400).send({
				message: "Reviews can only be written for completed events.",
			});
			return;
		}

		// Verify if a review for this payment already exists
		const existingReview = await prisma.reviews.findFirst({
			where: {
				paymentId: Number(paymentId),
				userId: userId,
			},
		});

		if (existingReview) {
			res.status(400).send({
				message: "You have already written a review for this payment.",
			});
			return;
		}

		// If all checks pass, proceed to the next middleware or route handler
		next();
	} catch (error) {
		console.error("Error in verifyReviewEligibility middleware:", error);
		res.status(500).send({
			message: "An error occurred while verifying review eligibility.",
		});
	}
};
