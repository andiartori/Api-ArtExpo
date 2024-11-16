import { UserService } from "../services/user.service";
import { Request, Response } from "express";

export class UserController {
	private userService = new UserService();

	constructor() {
		this.userService = new UserService();
	}

	async getReviews(req: Request, res: Response) {
		try {
			// Extract `page` and `limit` from query parameters and set defaults
			const page = parseInt(req.query.page as string, 10) || 1;
			const limit = parseInt(req.query.limit as string, 10) || 3;
			const offset = (page - 1) * limit;

			// Fetch paginated reviews using the updated service method
			const reviews = await this.userService.getReviews(offset, limit);

			if (reviews && reviews.length > 0) {
				res.status(200).send({
					data: reviews,
					status: res.statusCode,
				});
			} else {
				res.status(404).send({
					message: "No reviews found",
					status: res.statusCode,
				});
			}
		} catch (error) {
			res.status(500).send({
				message: "An error occurred while fetching reviews.",
				status: res.statusCode,
			});
		}
	}
	async searchEvents(req: Request, res: Response): Promise<void> {
		const { term, category, page = 1, limit = 6 } = req.query;

		try {
			const pageNumber = parseInt(page as string, 10);
			const limitNumber = parseInt(limit as string, 10);
			const offset = (pageNumber - 1) * limitNumber;

			if (
				(typeof term !== "string" || term.trim() === "") &&
				(typeof category !== "string" || category.trim() === "")
			) {
				// If no search term or category, fetch paginated events
				const events = await this.userService.getAllEventsPaginated(
					offset,
					limitNumber
				);
				if (events.length > 0) {
					res.status(200).send({
						data: events,
						status: res.statusCode,
					});
				} else {
					res.status(404).send({
						data: [],
						message: "No events found",
						status: res.statusCode,
					});
				}
			} else {
				// If there is a search term or category, proceed with a paginated search
				const events = await this.userService.searchEventsPaginated(
					term as string,
					category as string,
					offset,
					limitNumber
				);
				if (events.length > 0) {
					res.status(200).send({
						data: events,
						status: res.statusCode,
					});
				} else {
					res.status(404).send({
						data: [],
						message: "No events found",
						status: res.statusCode,
					});
				}
			}
		} catch (error) {
			res.status(500).send({
				status: "error",
				message: "An error occurred while searching for events.",
			});
		}
	}

	async createUser(req: Request, res: Response): Promise<void> {
		const { username, email, password, referral_code } = req.body;

		// Validate the input
		if (!username || !email || !password) {
			res.status(400).json({
				status: "error",
				message: "Username, Email, and Password are required",
			});
			return;
		}

		try {
			// Check if the email is already registered
			const existingUser = await this.userService.findUserByEmail(email);
			if (existingUser) {
				res.status(400).json({
					status: "error",
					message: "Email is already registered",
				});
				return;
			}

			// Attempt to create the new user
			const newUser = await this.userService.createUser(
				{ username, email, password },
				referral_code
			);

			res.status(201).json({
				status: "success",
				message: "User registered successfully",
				data: newUser,
			});
		} catch (error) {
			// Log the error for debugging
			const err = error as Error;

			// Determine response based on the error message
			let errorMessage = "Failed to register";
			if (err.message === "Invalid referral code.") {
				errorMessage = "The referral code you entered is invalid.";
			} else if (err.message === "Email is already registered.") {
				errorMessage = "This email is already registered.";
			}

			res.status(400).json({
				status: "error",
				message: errorMessage,
			});
		}
	}

	async bookEvent(req: Request, res: Response): Promise<void> {
		const { userId, eventId } = req.body;

		// Step 1: Validate input
		if (!userId || !eventId) {
			res.status(400).send({
				status: "error",
				message: "User ID and Event ID are required",
			});
			return;
		}

		// Step 2: Execute the service method and handle the result
		const booking = await this.userService.bookEvent(userId, eventId);

		// Step 3: Check for booking success or failure
		if (booking) {
			res.status(201).send({
				status: "success",
				message: "Event booked successfully",
				data: booking,
			});
		} else {
			res.status(400).send({
				status: "error",
				message: "Failed to book event",
			});
		}
	}

	async bookEventWithoutPoints(req: Request, res: Response): Promise<void> {
		const { userId, eventId } = req.body;

		// Step 1: Validate input
		if (!userId || !eventId) {
			res.status(400).send({
				status: "error",
				message: "User ID and Event ID are required",
			});
			return;
		}

		// Step 2: Execute the service method and handle the result
		const booking = await this.userService.bookEventWithoutPoints(
			userId,
			eventId
		);

		// Step 3: Check for booking success or failure
		if (booking) {
			res.status(201).send({
				status: "success",
				message: "Event booked successfully",
				data: booking,
			});
		} else {
			res.status(400).send({
				status: "error",
				message: "Failed to book event",
			});
		}
	}
	async deleteBooking(req: Request, res: Response): Promise<void> {
		const { bookingId } = req.params;

		try {
			// Attempt to delete the booking
			await this.userService.deleteBooking(Number(bookingId));

			// If no error is thrown, the deletion was successful
			res.status(200).send({
				status: "success",
				message: "Booking deleted successfully",
			});
		} catch (error) {
			const err = error as Error; // or `as Error` if you prefer

			if (err.message.includes("Booking does not exist")) {
				// Specific error handling if booking not found
				res.status(404).send({
					status: "error",
					message: "Booking not found or already deleted",
				});
			} else {
				// Handle other potential errors
				res.status(500).send({
					status: "error",
					message: "Failed to delete booking due to server error.",
					details: err.message || "An error occurred.",
				});
			}
		}
	}

	async getUserById(req: Request, res: Response): Promise<void> {
		// Step 1: Extract userId from request parameters
		const { userId } = req.params;

		if (!userId) {
			res.status(400).send({
				status: "error",
				message: "User ID is required",
			});
			return;
		}

		try {
			// Step 2: Call the service to retrieve the user data by ID
			const user = await this.userService.findUserById(Number(userId));

			// Step 3: Check if user data was found
			if (user) {
				res.status(200).send({
					status: "success",
					message: "User data retrieved successfully",
					data: user,
				});
			} else {
				res.status(404).send({
					status: "error",
					message: "User not found",
				});
			}
		} catch (error) {
			res.status(500).send({
				status: "error",
				message: "An error occurred while retrieving user data",
			});
		}
	}

	async purchaseEvent(req: Request, res: Response) {
		const { userId, bookingId } = req.body; // Assuming userId and bookingId are provided in the body

		try {
			// Call the purchaseEvent function from UserService
			const purchaseResult = await this.userService.purchaseEvent(
				userId,
				bookingId
			);

			// Respond with the purchase result
			res.status(201).send({
				message: "Payment completed successfully",
				data: purchaseResult,
				status: res.statusCode,
			});
		} catch (error) {
			const err = error as Error;
			res.status(400).send({
				message: `Failed to complete payment: ${err.message}`,
				status: res.statusCode,
			});
		}
	}

	async getPurchaseById(req: Request, res: Response) {
		const paymentId = req.params.paymentId; // Assuming payment_id is provided in the request parameters

		try {
			// Call the getPurchaseById function from UserService
			const purchase = await this.userService.getPurchaseById(
				Number(paymentId)
			);

			// Respond with the purchase data
			res.status(200).send({
				message: "Purchase retrieved successfully",
				data: purchase,
				status: res.statusCode,
			});
		} catch (error) {
			res.status(500).send({
				message: "Failed to retrieve purchase data",
				status: res.statusCode,
			});
		}
	}

	async addReview(req: Request, res: Response): Promise<void> {
		const { userId, paymentId, reviewText, rating } = req.body; // Get userId and paymentId from req.body

		// Validate input
		if (!reviewText || !rating) {
			res.status(400).send({
				status: "error",
				message: "Review text and rating are required",
			});
			return;
		}

		try {
			// Call the service method to add the review
			const newReview = await this.userService.addReview(
				userId,
				Number(paymentId),
				reviewText,
				rating
			);

			res.status(201).send({
				status: "success",
				message: "Review added successfully",
				data: newReview,
			});
		} catch (error) {
			const err = error as Error;
			res.status(400).send({
				status: "error",
			});
		}
	}

	async getAllBookedEventsByUser(req: Request, res: Response): Promise<void> {
		try {
			const { userId } = req.params;

			// Validate the user ID
			if (!userId) {
				res.status(400).send({
					status: "error",
					message: "User ID is required",
				});
				return;
			}

			// Fetch all booked events for the user
			const bookedEvents = await this.userService.getAllBookedEventsByUser(
				Number(userId)
			);

			if (bookedEvents.length > 0) {
				res.status(200).send({
					status: "success",
					message: "Booked events retrieved successfully",
					data: bookedEvents,
				});
			} else {
				res.status(404).send({
					status: "error",
					message: "No booked events found for this user",
				});
			}
		} catch (error) {
			res.status(500).send({
				status: "error",
				message: "An error occurred while fetching booked events",
			});
		}
	}
}
