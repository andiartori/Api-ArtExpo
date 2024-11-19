import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { Auth } from "../models/models";

const JWT_SECRET = process.env.JWT_SECRET as string;

interface DecodedToken {
	user: number; // The ID of the user
	id: number;
}

export class AuthService {
	private prisma: PrismaClient;

	constructor() {
		this.prisma = new PrismaClient();
	}

	async register(data: Auth) {
		// Check if the provided role is "admin"
		if (data.role.toLowerCase() === "admin") {
			// Return a message instead of throwing an error
			return {
				success: false,
				message: "Cannot register with admin role.",
			};
		}
		const hashedPassword = await bcrypt.hash(data.password, 10);
		return this.prisma.users.create({
			data: {
				username: data.username,
				email: data.email,
				password: hashedPassword,
				role: data.role,
			},
		});
	}

	async login(email: string, password: string) {
		const user = await this.prisma.users.findUnique({
			where: {
				email: email,
			},
		});

		if (!user || !(await bcrypt.compare(password, user.password)) || "") {
			throw new Error("Invalid email or password");
		}

		const accessToken = jwt.sign(
			{ user: user.user_id, role: user.role },
			JWT_SECRET,
			{
				expiresIn: "1h",
			}
		);

		const refreshToken = jwt.sign(
			{ id: user.user_id, role: user.role },
			JWT_SECRET,
			{
				expiresIn: "7d",
			}
		);

		//simpan refresh token di db
		await this.prisma.users.update({
			where: {
				email: email,
			},
			data: {
				// oauth_token: accessToken,
				refresh_token: refreshToken,
			},
		});

		return { accessToken, refreshToken, user };
	}

	async refreshToken(token: string) {
		try {
			const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;

			const user = await this.prisma.users.findUnique({
				where: {
					user_id: decoded.id,
				},
			});

			if (!user || user.refresh_token !== token) {
				throw new Error("Invalid refresh token");
			}

			const accessToken = jwt.sign(
				{ id: user.user_id, role: user.role },
				JWT_SECRET,
				{ expiresIn: "1m" }
			);

			return accessToken;
		} catch (error) {
			throw new Error("Invalid refresh token");
		}
	}
}
