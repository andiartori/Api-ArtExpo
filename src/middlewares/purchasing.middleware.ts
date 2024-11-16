import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { DecodedTokenDelete } from "../models/models";

const prisma = new PrismaClient();

interface RequestWithUser extends Request {
	user?: DecodedTokenDelete; // Attach user info to the request object
}

export const verifyUserAndBooking = async (
	req: RequestWithUser,
	res: Response,
	next: NextFunction
): Promise<void> => {
	const token = req.headers.authorization?.split(" ")[1];
	const { userId, bookingId } = req.body;
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
		const decoded = jwt.verify(token, JWT_SECRET) as {
			user: number;
			role: string;
		};

		// Check if the token's user ID matches the provided userId
		if (decoded.user !== userId) {
			res.status(403).send({
				status: "error",
				message: "Token does not match the provided user ID",
			});
			return;
		}

		// Check if the booking belongs to the user
		const booking = await prisma.bookings.findUnique({
			where: {
				booking_id: bookingId,
			},
			select: {
				userId: true,
			},
		});

		// If the booking does not exist or does not belong to the user, return an error
		if (!booking || booking.userId !== userId) {
			res.status(403).send({
				status: "error",
				message: "Unauthorized access to the booking",
			});
			return;
		}

		// Attach decoded data to `req.user` and allow request to proceed
		req.user = decoded; // Attach decoded data to `req.user`
		next();
	} catch (error) {
		console.error("Token verification failed:", error);
		res.status(401).send({
			status: "error",
			message: "Invalid token",
		});
	}
};
