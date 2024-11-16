import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { Auth } from "../models/models";

export class AuthController {
	private authService: AuthService;

	constructor() {
		this.authService = new AuthService();
	}

	async login(req: Request, res: Response) {
		try {
			const { email, password } = req.body;
			const { accessToken, refreshToken, user } = await this.authService.login(
				email,
				password
			);
			const data = { accessToken, refreshToken, user };
			res.status(200).send({
				data: {
					user: data.user,
					access_token: data.accessToken,
					refresh_token: data.refreshToken,
				},
				message: "Successfully login",
				status: res.statusCode,
			});
		} catch (error: any) {
			res.status(404).send({
				message: `Failed to login`,
				detail: error.errors,
				status: res.statusCode,
			});
		}
	}

	async register(req: Request, res: Response) {
		try {
			const user: Auth = req.body;
			await this.authService.register(user);
			res.status(201).send({
				message: "Successfully registered",
				status: res.statusCode,
			});
		} catch (error) {
			// Cek apakah error.errors ada dan memiliki setidaknya satu elemen
			const err = error as Error;
			const errorMessage =
				err.message && err.message.length > 0
					? err.message[0].toString()
					: err.message || "Unknown error occurred";

			res.status(400).send({
				message: `Failed to register: ${errorMessage}`,
				status: res.statusCode,
			});
		}
	}

	async refreshToken(req: Request, res: Response) {
		const { refreshToken } = req.body;
		const newAccessToken = await this.authService.refreshToken(refreshToken);
		if (newAccessToken) {
			res.status(200).send({
				data: {
					access_token: newAccessToken, // Return access token instead
				},
				message: "Access token refreshed",
				status: res.statusCode,
			});
		} else {
			res.status(400).send({
				message: "Failed to retrieve access token. Please try again later.",
				status: res.statusCode,
			});
		}
	}
}
