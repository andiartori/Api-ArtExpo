export interface Event {
	event_name: string;
	location: string;
	image: string;
	description: string;
	event_date: string;
	event_type: string;
	ticket_available: number;
	price: number;
	discounted_price?: number;
}

export interface Auth {
	email: string;
	username: string;
	password: string;
	role: string;
}

// Define interfaces for better type safety
export interface DecodedToken {
	userId: string; // or any other properties in the decoded token
	role: string;
}

export interface RequestWithUser extends Request {
	user?: DecodedToken;
}


export interface MulterErrorAdminController extends Error {
	code?: string; 
}

export interface User {
	id: string; // Assuming the decoded token contains an id field
	role: string; // Keeping role as a string, as you requested
}

export interface RequestWithUserAuth extends Request {
	user?: User; // user will be added to the request object
}

export interface DecodedTokenDelete {
	user: number;
	role: string;
}

export interface DecodedTokenAdmin {
	user : number;
}

export interface DecodedTokenAuth {
	user : number;
	id : number;
}