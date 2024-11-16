import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client"; // Ensure you import your Prisma client instance
import { DecodedTokenAdmin } from "../models/models";

const prisma = new PrismaClient();

interface RequestWithUser extends Request {
	user?: number; // Attach user ID to the request object
}

// Middleware to check if the user owns the purchase
export const verifyPurchaseOwnership = async (
	req: RequestWithUser, // Use RequestWithUser to type the request object
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		// Get the token from the Authorization header
		const token = req.headers.authorization?.split(" ")[1];
		if (!token) {
			res
				.status(401)
				.json({ message: "Unauthorized access. No token provided." });
			return;
		}

		// Verify and decode the token to extract the user ID
		const decodedToken = jwt.verify(
			token,
			process.env.JWT_SECRET as string
		) as DecodedTokenAdmin;
		const userId = decodedToken.user;

		// Get the paymentId from request params
		const paymentId = req.params.paymentId;

		// Check if the payment exists and belongs to the user
		const payment = await prisma.payments.findUnique({
			where: { payment_id: Number(paymentId) },
			select: {
				booking: {
					select: {
						userId: true, // Ensure userId is included to check ownership
					},
				},
			},
		});

		if (!payment) {
			res.status(404).json({ message: "Payment not found." });
			return;
		}

		// Check if the userId from the token matches the owner of the payment
		if (payment.booking.userId !== userId) {
			res
				.status(403)
				.json({ message: "Access denied. You do not own this payment." });
			return;
		}

		// If the user owns the payment, proceed to the next middleware or route handler
		next();
	} catch (error) {
		console.error("Error in verifyPurchaseOwnership middleware:", error);
		res.status(500).json({ message: "Internal server error." });
	}
};
