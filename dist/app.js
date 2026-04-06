"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_errors_1 = __importDefault(require("http-errors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const node_path_1 = __importDefault(require("node:path"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const index_1 = __importDefault(require("./routes/index"));
const users_1 = __importDefault(require("./routes/users"));
const lists_1 = __importDefault(require("./routes/lists"));
const swagger_1 = require("./swagger");
const app = (0, express_1.default)();
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";
app.set("views", node_path_1.default.join(__dirname, "..", "views"));
app.set("view engine", "jade");
app.use((0, morgan_1.default)("Received a new request! :method :url :status :res[content-length] - :response-time ms"));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.static(node_path_1.default.join(__dirname, "..", "public")));
app.use((req, res, next) => {
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
app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec));
app.use("/", index_1.default);
app.use("/auth", users_1.default);
app.use("/lists", lists_1.default);
app.use((req, res, next) => {
    next((0, http_errors_1.default)(404));
});
app.use((err, req, res, next) => {
    void next;
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};
    res.status(err.status ?? 500);
    res.render("error");
});
exports.default = app;
