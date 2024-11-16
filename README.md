Event Management System README
Overview
The Event Management System is a web application that allows users and administrators to manage, book, and review events seamlessly. The platform is designed with key functionalities for both users and administrators, ensuring security, user-friendliness, and efficient operations.

Features
User Features
Registration and Authentication:

Users can register using email, password, and other basic credentials.
Registration is available only for users with the user role.
The referral-code feature enables users to earn points when they successfully invite others to register.
Referral codes have no expiration date, allowing users to continuously bring in new participants.
Event Browsing and Booking:

Users can easily search for events using a search bar or filter by categories.
Two booking options are available:
With Tokens: Apply referral points for discounts.
Without Tokens: Regular booking without applying points.
Booked events are displayed in the Booked-List section for easy tracking.
Booked-List Features:

Users can perform multiple actions on the same page:
Make payments for booked events.
View tickets for paid bookings.
Cancel bookings and get points refunded if applicable.
Write reviews for attended events.
Points System:

Referral points are converted into discounts at a rate of 1 point = Rp. 1,000.
If the discount exceeds the event price, users can attend the event for free.
Remaining points from a discount are not carried forward for future use.
Canceled bookings return the applied points to the user's account.
Authentication & Authorization:

Every logged-in user is secured with an access_token for authentication and authorization.
Tokens ensure secure operations and prevent unauthorized actions.
Admin Features
Event Management:

Create new events with a specified type (e.g., free events have a price of 0).
View a list of all events and edit existing events:
Admins must manually change the event type to "Completed" when an event concludes.
View statistics including:
Monthly ticket sales.
Event-type distribution charts.
Number of registered users.
Total revenue.
Middleware Security:

Admin activities are secured using middleware that verifies the authenticity of requests.
Middleware ensures the validity of the request body and parameters.
Tokens are verified to confirm the admin's identity for secure operations.
Event Date Flexibility:

For development purposes, event dates can be set to a past date.
Authentication & Authorization:

Logged-in admins are protected using an access_token to ensure secure and authorized activities.
How Referral Points Work
Users earn points by inviting others through their referral codes.
Points are used as discounts during event bookings.
If the points' value exceeds the event price, the event becomes free for the user.
Points from canceled bookings are refunded to the user's account.
Installation
Clone the repository:

bash
Copy code
git clone https://github.com/your-repository.git
cd your-repository
Install dependencies:

bash
Copy code
npm install
Set up environment variables:

Create a .env file with the following:
makefile
Copy code
DATABASE_URL=your-database-url
JWT_SECRET=your-jwt-secret
Run the application:

bash
Copy code
npm run dev
Usage
Users:
Register and log in using valid credentials.
Browse events, book tickets, and manage bookings using the intuitive interface.
Admins:
Log in to access the admin dashboard for event management, statistics, and operations.
Security
All routes are protected by middleware to ensure only authorized users and admins can perform specific actions.
Authentication tokens (access_token) are used to validate requests and prevent unauthorized access.
