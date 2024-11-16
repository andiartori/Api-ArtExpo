import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { DecodedTokenDelete } from "../models/models";



interface RequestWithUser extends Request {
	user?: DecodedTokenDelete; // Attach user info to the request object
}

export const isAuthenticatedForBookedList = (
	req: RequestWithUser,
	res: Response,
	next: NextFunction
): void => {
	const token = req.headers.authorization?.split(" ")[1];
	const { userId } = req.params;
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

		console.log("Decoded user ID:", decoded.user);

		// Check if userId exists in decoded token
		if (decoded.user !== Number(userId)) {
			res.status(403).send({
				status: "error",
				message: "Token does not contain valid user information",
			});
			return;
		}

		// Attach decoded data to `req.user` (using `any` to bypass TypeScript)
		req.user = decoded; // Attach decoded data to `req.user`
		next(); // Proceed if verification passes
	} catch (error) {
		console.error("Token verification failed:", error);
		res.status(401).send({
			status: "error",
			message: "Invalid token",
		});
	}
};
