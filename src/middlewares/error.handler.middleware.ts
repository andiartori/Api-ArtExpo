import { Request, Response, NextFunction } from "express";

export class ErrorHandlerMiddleware {
	errorHandler() {
		return (err: Error, req: Request, res: Response, next: NextFunction) => {
			console.log(`[Error] , ${err.message} `);
			res.status(500).send({
				details: err.message,
				message: "Internal Server Error",
			});
			next();
		};
	}
}
