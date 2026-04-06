import createError from "http-errors";
import cookieParser from "cookie-parser";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import logger from "morgan";
import path from "node:path";
import swaggerUi from "swagger-ui-express";

import indexRouter from "./routes/index";
import usersRouter from "./routes/users";
import listsRouter from "./routes/lists";
import { swaggerSpec } from "./swagger";

const app = express();
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";

app.set("views", path.join(__dirname, "..", "views"));
app.set("view engine", "jade");

app.use(
  logger(
    "Received a new request! :method :url :status :res[content-length] - :response-time ms",
  ),
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "..", "public")));
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.headers.origin === frontendOrigin) {
    res.header("Access-Control-Allow-Origin", frontendOrigin);
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
    res.header("Vary", "Origin");
  }

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  next();
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/", indexRouter);
app.use("/auth", usersRouter);
app.use("/lists", listsRouter);

app.use((req: Request, res: Response, next: NextFunction) => {
  next(createError(404));
});

app.use(
  (
    err: { message: string; status?: number },
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    void next;

    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    res.status(err.status ?? 500);
    res.render("error");
  },
);

export default app;
