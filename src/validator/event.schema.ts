import { z as validate } from "zod";

export const eventSchema = validate.object({
	event_name: validate.string().min(1, "Name is required"),
	location: validate.string().min(1, "Location is required"),
	description: validate.string().min(1, "Description is required"),
	event_date: validate.string().min(1, "Date is required"),
	event_type: validate.enum([
		"Exhibition",
		"Theater",
		"Festival",
		"Performing",
		"Completed",
	]),
	ticket_available: validate
		.number()
		.min(10, "Ticket available must be a positive number"),
	price: validate.number().positive("Price must be positive"),
	image: validate.string().min(1, "URL is required"),
});


export const eventSchemaForUpdate = validate.object({
	event_name: validate.string().min(1, "Name is required"),
	location: validate.string().min(1, "Location is required"),
	description: validate.string().min(1, "Description is required"),
	event_date: validate.string().min(1, "Date is required"),
	event_type: validate.enum([
		"Exhibition",
		"Theater",
		"Festival",
		"Performing",
		"Completed",
	]),
	ticket_available: validate
		.number()
		.min(10, "Ticket available must be a positive number"),
	price: validate.number().positive("Price must be positive"),
});
