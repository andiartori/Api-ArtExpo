import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { DecodedTokenAdmin } from "../models/models";

const prisma = new PrismaClient();

interface RequestWithUser extends Request {
	user?: {
		// Attach user information to the request object
		user_id: number;
		role: string;
	};
}

export const verifyAdminToken = async (
	req: RequestWithUser, // Use RequestWithUser to type the request object
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const token = req.headers.authorization?.split(" ")[1];

		// Check if token is present
		if (!token) {
			res.status(401).json({ message: "Access token is required" });
			return;
		}

		// Verify and decode token
		const decoded = jwt.verify(
			token,
			process.env.JWT_SECRET!
		) as DecodedTokenAdmin;
		const userId = decoded.user;

		// Fetch the user from the database
		const user = await prisma.users.findUnique({
			where: { user_id: userId },
		});

		// Check if user exists and is an admin
		if (!user || user.role !== "admin") {
			res.status(403).json({ message: "Unauthorized access" });
			return;
		}

		// Optionally: attach user info to req for further checks in controllers if needed
		req.user = user;

		next();
	} catch (error) {
		console.error("Error in verifyAdminToken middleware:", error);
		res.status(401).json({ message: "Invalid access token" });
	}
};
