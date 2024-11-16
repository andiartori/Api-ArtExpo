import { PrismaClient } from "@prisma/client";
import { Event } from "../models/models";
import { eventSchema, eventSchemaForUpdate } from "../validator/event.schema";

import cloudinary from "../config/cloudinary";

export class AdminService {
	private prisma: PrismaClient;

	constructor() {
		this.prisma = new PrismaClient();
	}

	async getEvents() {
		return this.prisma.events.findMany();
	}

	async getEventsById(event_id: number) {
		return this.prisma.events.findUnique({ where: { event_id } });
	}

	async createEvent(data: Event) {
		const validatedData = eventSchema.parse(data);

		// upload gambar ke cloudinary
		const uploadResponse = await cloudinary.uploader.upload(
			validatedData.image,
			{
				folder: "Art",
			}
		);

		return this.prisma.events.create({
			data: {
				event_name: validatedData.event_name,
				location: validatedData.location,
				image: uploadResponse.secure_url,
				description: validatedData.description,
				event_date: validatedData.event_date,
				event_type: validatedData.event_type,
				ticket_available: validatedData.ticket_available,
				price: validatedData.price,
			},
		});
	}

	async updateEvent(event_id: number, data: Event) {
		const validatedData = eventSchemaForUpdate.parse(data);

		const existingEvent = await this.prisma.events.findUnique({
			where: { event_id },
		});

		if (!existingEvent) {
			throw new Error(`Event with id ${event_id} not found.`);
		}

		// Use the existing image if no new image is uploaded
		const imageUrl =
			data.image && data.image.length > 0
				? (await cloudinary.uploader.upload(data.image, { folder: "Art" }))
						.secure_url
				: existingEvent.image;

		return this.prisma.events.update({
			where: { event_id },
			data: {
				event_name: validatedData.event_name,
				location: validatedData.location,
				description: validatedData.description,
				event_type: validatedData.event_type,
				event_date: validatedData.event_date,
				ticket_available: validatedData.ticket_available,
				price: validatedData.price,
				image: imageUrl, // Set the final image URL
			},
		});
	}

	async deleteEvent(event_id: number) {
		await this.prisma.reviews.deleteMany({
			where: {
				eventId: event_id,
			},
		});
		// Step 1: Delete related payments first
		await this.prisma.payments.deleteMany({
			where: {
				booking: {
					eventId: event_id,
				},
			},
		});

		// Step 2: Delete related bookings
		await this.prisma.bookings.deleteMany({
			where: {
				eventId: event_id,
			},
		});

		// Step 3: Now delete the event itself
		return this.prisma.events.delete({
			where: {
				event_id,
			},
		});
	}

	async getAllPurchase() {
		return await this.prisma.payments.findMany({
			select: {
				payment_id: true,
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

	//For Statistic Purposes
	async getMonthlyStatistics(): Promise<
		{
			month: number;
			total_amount: string | null;
		}[]
	> {
		// Fetch total amounts by month
		const totalAmountResult: { month: number; total_amount: BigInt }[] =
			await this.prisma.$queryRawUnsafe(`
		SELECT 
		  EXTRACT(MONTH FROM e.event_date) AS month,
		  SUM(p.total_amount) AS total_amount
		FROM "ArtExpoSchema"."Payments" p
		JOIN "ArtExpoSchema"."Bookings" b ON p."bookingId" = b.booking_id
		JOIN "ArtExpoSchema"."Events" e ON b."eventId" = e.event_id
		GROUP BY month
		ORDER BY month;
	`);


		// Map total amounts and tickets sold to the same monthly structure
		const monthlyStatistics = totalAmountResult.map((totalRow) => {
			// Convert ticketsSoldResult's month to a number for comparison

			return {
				month: totalRow.month,
				total_amount: totalRow.total_amount
					? totalRow.total_amount.toString()
					: null,
			};
		});

		return monthlyStatistics;
	}

	async countEventTypes() {
		return this.prisma.events.groupBy({
			by: ["event_type"],
			_count: {
				event_type: true,
			},
		});
	}

	// Function to count total registered users
	async countTotalUsers(): Promise<number> {
		return this.prisma.users.count({
			where: {
				role: "user", // Only count users with the role "user"
			},
		});
	}

	// Function to calculate the total amount of all paid events
	async getTotalPaidAmount(): Promise<number> {
		const result = await this.prisma.payments.aggregate({
			_sum: {
				total_amount: true,
			},
			where: {
				payment_status: "completed", // Assuming "completed" status indicates a paid event
			},
		});
		return result._sum.total_amount || 0;
	}
}
