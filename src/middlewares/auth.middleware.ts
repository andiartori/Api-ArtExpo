import { Request, Response, NextFunction } from "express";
import environment from "dotenv";
import jwt, { VerifyErrors, JwtPayload } from "jsonwebtoken";
import { User } from "../models/models";

environment.config();

interface RequestWithUser extends Request {
	user?: User; // user will be added to the request object
}

export class AuthenticateJwtMiddleware {
	authenticateJwt(
		req: RequestWithUser,
		res: Response,
		next: NextFunction
	): void {
		const token = req.headers.authorization?.split(" ")[1] as string;
		const JWT_SECRET = process.env.JWT_SECRET as string;

		if (!token) {
			res.status(401).send({
				message: "Access token is missing or invalid",
				status: res.statusCode,
			});
			return; // Ensuring no further code is executed after sending the response
		}

		jwt.verify(
			token,
			JWT_SECRET,
			(err: VerifyErrors | null, decoded: string | JwtPayload | undefined) => {
				if (err) {
					res.status(401).send({
						message: "Invalid token",
						status: res.statusCode,
					});
					return; // Ensuring no further code is executed after sending the response
				} else {
					// Assuming decoded token is an object with user information
					req.user = decoded as User;
					next();
				}
			}
		);
	}

	authorizeRole(
		roles: string
	): (req: RequestWithUser, res: Response, next: NextFunction) => void {
		return (req: RequestWithUser, res: Response, next: NextFunction): void => {
			if (req.user?.role !== roles) {
				res.status(403).send({
					message: "Forbidden",
					status: res.statusCode,
				});
				return; // Ensuring no further code is executed after sending the response
			}
			next();
		};
	}
}
