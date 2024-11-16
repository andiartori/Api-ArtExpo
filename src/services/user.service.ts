import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

interface User {
	username: string;
	email: string;
	password: string;
}

export class UserService {
	private prisma = new PrismaClient();

	constructor() {
		this.prisma = new PrismaClient();
	}

	// Function to see paginated reviews
	async getReviews(offset = 0, limit = 3) {
		// Include related `user` and `event` data with pagination
		return this.prisma.reviews.findMany({
			skip: offset,
			take: limit,
			include: {
				user: {
					select: {
						username: true, // Select only the `username` field from the `Users` table
					},
				},
				event: {
					select: {
						event_name: true, // Select only the `event_name` field from the `Events` table
					},
				},
			},
		});
	}

	async getAllEventsPaginated(offset: number, limit: number) {
		return this.prisma.events.findMany({
			skip: offset,
			take: limit,
		});
	}

	async searchEventsPaginated(
		searchTerm: string,
		eventType: string | null,
		offset: number,
		limit: number
	) {
		return this.prisma.events.findMany({
			where: {
				AND: [
					{
						event_name: {
							contains: searchTerm,
							mode: "insensitive",
						},
					},
					eventType ? { event_type: eventType } : {},
				],
			},
			skip: offset,
			take: limit,
		});
	}

	async findUserByEmail(email: string) {
		return await this.prisma.users.findFirst({ where: { email } });
	}

	// Function to create a new user with an optional referral code
	async createUser(data: User, referral_code?: string) {
		let referrerUserId: number | null = null;
		// Check if a referral code was provided
		if (referral_code) {
			// Find the referral code in the `referralCodes` table
			const referralOwner = await this.prisma.referralCodes.findFirst({
				where: { referral_code },
			});

			if (!referralOwner) {
				throw new Error("Invalid referral code.");
			}

			// Store the referrer's user ID to update points later
			referrerUserId = referralOwner.userId;
		}

		// Check if the email is already registered
		const existingUser = await this.prisma.users.findFirst({
			where: { email: data.email },
		});
		if (existingUser) {
			throw new Error("Email is already registered.");
		}

		// Hash the password before storing it
		const hashedPassword = await bcrypt.hash(data.password, 10);

		// Create the user and referral within a transaction
		return this.prisma.$transaction(async (tx) => {
			// Create a new user
			const user = await tx.users.create({
				data: {
					...data,
					role: "user",
					password: hashedPassword,
					points: 0,
					createdAt: new Date(),
				},
			});

			// Create a referral entry for the new user in `referralCodes`
			const referral = await tx.referralCodes.create({
				data: {
					userId: user.user_id,
					referral_points: 50,
					count_used: 0,
					created_at: new Date(),
					referral_code: this.generateReferralCode(),
				},
			});

			// Increment points of the referrer if referral code was provided
			if (referrerUserId) {
				await tx.users.update({
					where: { user_id: referrerUserId },
					data: { points: { increment: 50 } },
				});

				// Update referral code usage count
				await tx.referralCodes.update({
					where: { referral_id: referral.referral_id },
					data: { count_used: { increment: 1 } },
				});
			}

			return { user, referral };
		});
	}

	// Generate a unique referral code
	generateReferralCode(): string {
		const letters = Array(3)
			.fill(0)
			.map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26))) // A-Z
			.join("");
		const numbers = Array(3)
			.fill(0)
			.map(() => Math.floor(Math.random() * 10)) // 0-9
			.join("");
		return letters + numbers;
	}

	async bookEvent(userId: number, eventId: number) {
		// Start a transaction to ensure atomic operations
		return this.prisma.$transaction(async (tx) => {
			// Step 0.5: Update the event with the discounted price and deduct one ticket
			await tx.events.update({
				where: { event_id: eventId },
				data: {
					discounted_price: 0,
				},
			});

			// Step 1: Check if the event exists
			const event = await tx.events.findUnique({
				where: { event_id: eventId },
			});

			if (!event) {
				throw new Error("Event does not exist.");
			}

			// Step 2: Check if tickets are available
			if (event.ticket_available < 1) {
				throw new Error("No tickets available for this event.");
			}

			// Step 3: Get the user's points and calculate the discount
			const user = await tx.users.findUnique({
				where: { user_id: userId },
				select: { points: true },
			});

			//pengecekan user points apakan ada atau tidak ketika di booking

			if (!user) {
				throw new Error("User does not exist.");
			}

			const pointMultiplier = 1000;
			const pointsInCurrency =
				user.points > 0 ? user.points * pointMultiplier : 0;
			let discountedPrice = event.price;
			let updatedUserPoints = 0;

			// Case: Apply discount only if the user has points
			if (user.points > 0) {
				discountedPrice -= pointsInCurrency;

				// Ensure discounted price does not go below zero
				if (discountedPrice < 0) {
					updatedUserPoints = Math.abs(discountedPrice / pointMultiplier);
					discountedPrice = 0;
				} else {
					// Deduct all user points if they were used in the discount calculation
					updatedUserPoints = 0;
				}
			} else if (user.points === 0) {
				discountedPrice = event.price;
				updatedUserPoints = 0;
			}

			// Step 4: Update the event with the discounted price and deduct one ticket
			await tx.events.update({
				where: { event_id: eventId },
				data: {
					discounted_price: discountedPrice,
					ticket_available: { decrement: 1 },
				},
			});

			// Step 5: Create the booking
			const booking = await tx.bookings.create({
				data: {
					userId: userId,
					eventId: eventId,
					quantity: 1,
					status: "draft",
					amount: discountedPrice,
				},
			});

			// Step 6: Update user points only if points were used in the booking
			if (user.points > 0) {
				await tx.users.update({
					where: { user_id: userId },
					data: { points: updatedUserPoints },
				});
			}

			// Return booking along with event price, discounted price, and points in currency
			return {
				booking,
				eventPrice: event.price,
				discountedPrice,
				pointsInCurrency,
			};
		});
	}

	async bookEventWithoutPoints(userId: number, eventId: number) {
		// Start a transaction to ensure atomic operations
		return this.prisma.$transaction(async (tx) => {
			// Step 1: Check if the event exists
			const event = await tx.events.findUnique({
				where: { event_id: eventId },
			});

			if (!event) {
				throw new Error("Event does not exist.");
			}

			// Step 2: Check if tickets are available
			if (event.ticket_available < 1) {
				throw new Error("No tickets available for this event.");
			}

			// Step 3: Get the user (for verification purposes, not for updating points)
			const user = await tx.users.findUnique({
				where: { user_id: userId },
			});

			if (!user) {
				throw new Error("User does not exist.");
			}

			// Step 4: Update the event to decrement one ticket without altering points
			await tx.events.update({
				where: { event_id: eventId },
				data: {
					discounted_price: event.price, // Full price, no discount applied
					ticket_available: { decrement: 1 },
				},
			});

			// Step 5: Create the booking with the full price
			const booking = await tx.bookings.create({
				data: {
					userId: userId,
					eventId: eventId,
					quantity: 1,
					status: "draft",
					amount: event.price, // Full price since no points are used
				},
			});

			// Ensure that no points are modified
			// No update to user points here

			// Return booking details along with the original event price
			return {
				booking,
				eventPrice: event.price,
			};
		});
	}

	async deleteBooking(bookingId: number) {
		// Start a transaction to ensure atomic operations
		return this.prisma.$transaction(async (tx) => {
			// Step 1: Check if the booking exists
			const booking = await tx.bookings.findUnique({
				where: { booking_id: bookingId },
				include: {
					event: true, // Include the event to access its information
					user: true, // Include the user to update points
				},
			});

			if (!booking) {
				throw new Error("Booking does not exist.");
			}

			// Step 2: Calculate the points to restore only if they were used
			const pointMultiplier = 1000; // The multiplier used for calculating points to currency
			const originalPointsUsed =
				(booking.event.price - booking.amount) / pointMultiplier;

			// Step 3: Ensure that points are only restored if they were actually used
			const pointsToRestore =
				booking.user.points > 0 && originalPointsUsed > 0
					? originalPointsUsed
					: 0;

			// Step 4: Update the event's ticket availability
			await tx.events.update({
				where: { event_id: booking.eventId },
				data: {
					ticket_available: { increment: booking.quantity }, // Re-add tickets based on quantity booked
				},
			});

			// Step 5: Update the user's points if points were used in the booking
			if (pointsToRestore > 0) {
				await tx.users.update({
					where: { user_id: booking.userId },
					data: {
						points: { increment: pointsToRestore },
					},
				});
			}

			// Step 6: Delete the booking
			await tx.bookings.delete({
				where: { booking_id: bookingId },
			});

			return {
				message: "Booking deleted, and points have been restored.",
				pointsRestored: pointsToRestore,
			};
		});
	}

	async findUserById(userId: number) {
		return await this.prisma.users.findUnique({
			where: { user_id: userId },
			select: {
				user_id: true,
				username: true,
				email: true,
				points: true,
				role: true,
				referralCodes: true,
				// Include bookings relation
				bookings: {
					select: {
						booking_id: true,
						quantity: true,
						booking_date: true,
						status: true,
						amount: true,
						payments: {
							select: {
								payment_id: true, // Include the payment_id in the booking
							},
						},
						event: {
							select: {
								event_id: true,
								event_name: true,
								location: true,
								event_date: true,
								event_type: true,
								price: true,
								discounted_price: true,
							},
						},
					},
				},
			},
		});
	}

	async purchaseEvent(userId: number, bookingId: number) {
		return this.prisma.$transaction(async (tx) => {
			// Step 1: Check if the booking exists and belongs to the user
			const booking = await tx.bookings.findUnique({
				where: { booking_id: bookingId },
				include: { event: true, user: true },
			});

			if (!booking || booking.userId !== userId) {
				throw new Error(
					"Booking does not exist or does not belong to the user."
				);
			}

			// Step 2: Calculate the total amount for the payment
			const totalAmount = booking.amount;

			// Step 3: Create the payment record with a `completed` status
			const payment = await tx.payments.create({
				data: {
					bookingId: booking.booking_id,
					total_amount: totalAmount,
					payment_date: new Date(),
					payment_status: "completed",
				},
			});

			await tx.bookings.update({
				where: { booking_id: bookingId },
				data: { status: "completed" },
			});

			return {
				message: "Payment completed successfully",
				payment,
				totalAmount,
			};
		});
	}

	async getPurchaseById(payment_id: number) {
		return await this.prisma.payments.findUnique({
			where: { payment_id: payment_id },
			select: {
				bookingId: true,
				total_amount: true,
				payment_date: true,
				payment_status: true,
				booking: {
					select: {
						booking_id: true,
						quantity: true,
						booking_date: true,
						status: true,
						amount: true,
						// Include event details in each booking
						event: {
							select: {
								event_id: true,
								event_name: true,
								location: true,
								event_date: true,
								event_type: true,
								price: true,
								discounted_price: true,
							},
						},
					},
				},
			},
		});
	}

	async addReview(
		userId: number,
		paymentId: number,
		reviewText: string,
		rating: number
	) {
		// Ensure the rating is valid
		if (rating < 1 || rating > 5) {
			throw new Error("Rating must be between 1 and 5.");
		}

		// Check if the payment exists and is associated with the user
		const payment = await this.prisma.payments.findUnique({
			where: { payment_id: paymentId },
			include: {
				booking: {
					include: {
						user: true,
						event: true,
					},
				},
			},
		});

		if (!payment) {
			throw new Error("Payment not found.");
		}

		if (payment.booking.user.user_id !== userId) {
			throw new Error("You can only write a review for your own payment.");
		}

		// Check if the event is marked as completed
		if (payment.booking.event.event_type !== "Completed") {
			throw new Error("Reviews can only be written for completed events.");
		}

		// Check if the user has already written a review for this payment
		const existingReview = await this.prisma.reviews.findFirst({
			where: {
				paymentId: paymentId,
				userId: userId,
			},
		});

		if (existingReview) {
			throw new Error("You have already written a review for this payment.");
		}

		// Create the review
		return await this.prisma.reviews.create({
			data: {
				userId: userId,
				eventId: payment.booking.event.event_id,
				paymentId: paymentId,
				review: reviewText,
				rating: rating,
				created_at: new Date(),
			},
		});
	}

	async getAllBookedEventsByUser(userId: number) {
		return this.prisma.bookings.findMany({
			where: {
				userId: userId,
			},
			include: {
				event: true, // Include event details
				payments: {
					include: {
						reviews: true, // Include reviews if needed
					},
				},
			},
		});
	}
}
