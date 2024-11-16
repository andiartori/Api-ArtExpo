import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import {DecodedTokenDelete} from "../models/models"

const prisma = new PrismaClient(); // Create an instance of PrismaClient



interface RequestWithUser extends Request {
	user?: DecodedTokenDelete; // Attach user info to the request object
}

export const deleteBookByBookId = async (
	req: RequestWithUser, // Updated to use RequestWithUser
	res: Response,
	next: NextFunction
): Promise<void> => {
	const token = req.headers.authorization?.split(" ")[1];
	const { bookingId } = req.params; // Get the bookingId from the request parameters
	const JWT_SECRET = process.env.JWT_SECRET as string;

	// Verify if token is present
	if (!token) {
		res.status(401).send({
			status: "error",
			message: "Access token is missing",
		});
		return;
	}

	try {
		// Verify and decode token
		const decoded = jwt.verify(token, JWT_SECRET) as DecodedTokenDelete;

		// Fetch the booking from the database to check ownership
		const booking = await prisma.bookings.findUnique({
			where: { booking_id: Number(bookingId) },
			select: { userId: true }, // Select only userId for checking ownership
		});

		// Check if the booking exists
		if (!booking) {
			res.status(404).send({
				status: "error",
				message: "Booking not found",
			});
			return;
		}

		// Check if the decoded user ID matches the booking's user ID
		if (decoded.user !== booking.userId) {
			res.status(403).send({
				status: "error",
				message: "You do not have permission to delete this booking",
			});
			return;
		}

		// Attach user information to the request object
		req.user = decoded; // No more 'any' here
		next(); // Proceed if ownership is verified
	} catch (error) {
		console.error("Token verification failed:", error);
		res.status(401).send({
			status: "error",
			message: "Invalid token",
		});
	}
};
