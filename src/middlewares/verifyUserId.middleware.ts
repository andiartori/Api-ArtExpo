import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { DecodedTokenDelete } from "../models/models";

interface RequestWithUser extends Request {
	user?: DecodedTokenDelete; // Attach user info to the request object
}

export const verifyUserId = (
	req: RequestWithUser,
	res: Response,
	next: NextFunction
): void => {
	const token = req.headers.authorization?.split(" ")[1];
	const { userId } = req.body;
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
		//debug if needed
		// console.log("this is decoded user id ", decoded.user);

		// Check if userId exists in decoded token
		if (decoded.user !== userId) {
			console.log(decoded.user);
			console.log("apakah masuk sini");
			console.log(typeof userId);
			res.status(403).send({
				status: "error",
				message: "Token does not contain valid user information",
			});
			return;
		}

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
