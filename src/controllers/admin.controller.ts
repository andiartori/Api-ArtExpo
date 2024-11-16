import { Request, Response } from "express";
import { AdminService } from "../services/admin.service";

import { Event, MulterErrorAdminController } from "../models/models";

interface RequestWithFile extends Request {
	file?: Express.Multer.File;
}

export class AdminController {
	private adminService: AdminService;

	constructor() {
		this.adminService = new AdminService();
	}

	async createEvent(req: RequestWithFile, res: Response) {
		try {
			const {
				event_name,
				location,
				description,
				event_date,
				event_type,
				ticket_available,
				price,
			} = req.body;

			// Access the image file from the request
			const image = req.file?.path || "";

			// Prepare the event data
			const event: Event = {
				event_name: event_name,
				location: location,
				description: description,
				event_date: event_date,
				event_type: event_type,
				ticket_available: Number(ticket_available),
				price: Number(price),
				image: String(image), // Ensure image is always a string
			};

			// Call the service to create the event
			await this.adminService.createEvent(event);

			res.status(201).send({
				message: "Event created successfully",
				status: res.statusCode,
			});
		} catch (error: unknown) {
			// Type check and cast to MulterError if it has a code
			if (
				error instanceof Error &&
				(error as MulterErrorAdminController).code
			) {
				const multerError = error as MulterErrorAdminController;
				if (multerError.code === "LIMIT_FILE_SIZE") {
					res.status(400).send({
						message: "File size is too large",
					});
				} else {
					res.status(400).send({
						message: `Failed to create event: ${multerError.message}`,
						detail: multerError.stack,
						status: res.statusCode,
					});
				}
			} else if (error instanceof Error) {
				// Handle general errors
				res.status(500).send({
					message: `An unexpected error occurred: ${error.message}`,
					status: res.statusCode,
				});
			} else {
				// Handle unknown errors
				res.status(500).send({
					message: "An unexpected error occurred.",
					status: res.statusCode,
				});
			}
		}
	}

	async getEvents(req: Request, res: Response) {
		const events = await this.adminService.getEvents();
		if (events) {
			res.status(200).send({
				data: events,
				status: res.statusCode,
			});
		} else {
			res.status(404).send({
				message: "No events found",
				status: res.statusCode,
			});
		}
	}

	async getEventsById(req: Request, res: Response) {
		const id = Number(req.params.id);
		const event = await this.adminService.getEventsById(id);
		if (event) {
			res.status(200).send({
				message: `Event with id ${id} was successfully retrieved`,
				data: event,
				status: res.statusCode,
			});
		} else {
			res.status(404).send({
				message: `Event with id ${id} not found`,
				status: res.statusCode,
			});
		}
	}

	async updateEvent(req: RequestWithFile, res: Response): Promise<void> {
		const id = Number(req.params.id);
		try {

			// Extract necessary fields from req.body
			const {
				event_name,
				location,
				description,
				event_date,
				event_type,
				ticket_available,
				price,
			} = req.body;

			// Check for required fields
			if (
				!event_name ||
				!location ||
				!description ||
				!event_date ||
				!event_type ||
				!ticket_available ||
				!price
			) {
				res.status(400).send({
					message: "All fields are required.",
					status: res.statusCode,
				});
			}

			// Prepare the event object
			const event: Event = {
				event_name,
				location,
				description,
				event_date,
				event_type,
				ticket_available: Number(ticket_available),
				price: Number(price),
				image: req.file?.path || "", // Handle the image
			};

			// Update the event using the admin service
			const updatedEvent = await this.adminService.updateEvent(id, event);

			res.status(200).send({
				message: `Event with id ${id} was successfully updated`,
				data: updatedEvent,
				status: res.statusCode,
			});
		} catch (error: unknown) {
			console.error("Error:", error); // Log the error for debugging
			// Check if the error is an instance of Error
			if (error instanceof Error) {
				if ((error as MulterErrorAdminController).code === "LIMIT_FILE_SIZE") {
					res.status(400).send({
						message: "File size is too large",
					});
				} else {
					res.status(500).send({
						message: `Failed to update event: ${error.message}`,
						details: error.stack || error,
						status: res.statusCode,
					});
				}
			} else {
				// Handle unknown errors
				res.status(500).send({
					message: "An unexpected error occurred.",
					status: res.statusCode,
				});
			}
		}
	}

	async deleteEvent(req: Request, res: Response) {
		const id = Number(req.params.id);
		const deletedEvent = await this.adminService.deleteEvent(id);
		if (deletedEvent) {
			res.status(200).send({
				message: `Event with id ${id} was successfully deleted`,
				status: res.statusCode,
			});
		} else {
			res.status(404).send({
				message: "Failed to delete event",
				status: res.statusCode,
			});
		}
	}

	async getAllPurchase(req: Request, res: Response) {
		try {
			// Call the getAllPurchase function from UserService
			const purchases = await this.adminService.getAllPurchase();

			// Respond with the purchase data
			res.status(200).send({
				message: "Purchases retrieved successfully",
				data: purchases,
				status: res.statusCode,
			});
		} catch (error) {
			console.error("Error in getAllPurchase:", error); // Log the error for debugging
			res.status(500).send({
				message: "Failed to retrieve purchase data",
				status: res.statusCode,
			});
		}
	}

	//for statistic purposes

	async getMonthlyStatistics(req: Request, res: Response) {
		try {
			const statistics = await this.adminService.getMonthlyStatistics();
			res.status(200).send({
				message: "Monthly statistics retrieved successfully",
				data: statistics,
				status: res.statusCode,
			});
		} catch (error) {
			res.status(500).send({
				message: "Failed to retrieve monthly statistics",
				details: "No stack trace available",
				status: res.statusCode,
			});
		}
	}

	async getEventTypeCounts(req: Request, res: Response) {
		try {
			const eventTypeCounts = await this.adminService.countEventTypes();
			res.status(200).json({
				data: eventTypeCounts,
				status: res.statusCode,
			});
		} catch (error) {
			console.error("Error fetching event type counts:", error);
			res.status(500).json({
				message: "An error occurred while fetching event type counts.",
				status: res.statusCode,
			});
		}
	}

	async getTotalUserCount(req: Request, res: Response) {
		try {
			const userCount = await this.adminService.countTotalUsers();
			res.status(200).json({ data: { userCount } });
		} catch (error) {
			console.error("Error fetching user count:", error);
			res.status(500).json({ message: "Error fetching user count" });
		}
	}

	async getTotalPaidAmount(req: Request, res: Response) {
		try {
			const totalPaidAmount = await this.adminService.getTotalPaidAmount();
			res.status(200).json({ data: { totalPaidAmount } });
		} catch (error) {
			console.error("Error fetching total paid amount:", error);
			res.status(500).json({ message: "Error fetching total paid amount" });
		}
	}
}
