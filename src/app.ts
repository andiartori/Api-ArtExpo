import express from "express";
import environment from "dotenv";
import cors from "cors";
import { ErrorHandlerMiddleware } from "./middlewares/error.handler.middleware";
import adminRouter from "./routers/admin.router";
import userRouter from "./routers/user.router";
import authRouter from "./routers/auth.router";

environment.config();

const app = express();
const PORT = process.env.SERVER_PORT_DEV;

const errorHandler = new ErrorHandlerMiddleware();

app.use(express.json());
app.use(
	cors({
		origin: "http://localhost:3000",
	})
);

app.use("/api/user", userRouter);

// jalur utama dari api
app.use("/api/admin", adminRouter);
//jalur utama dari api user
app.use("/api", userRouter);
//jalur auth
app.use("/api/auth", authRouter);

app.use(errorHandler.errorHandler());
app.listen(PORT, () => {
	console.log(`Listening on port : ${PORT}`);
});
