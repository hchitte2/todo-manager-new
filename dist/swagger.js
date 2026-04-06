"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
const node_path_1 = __importDefault(require("node:path"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Express Training API",
            version: "1.0.0",
            description: "Swagger documentation for the auth and list endpoints.",
        },
        servers: [
            {
                url: "http://localhost:3002",
                description: "Local development server",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
            schemas: {
                ErrorResponse: {
                    type: "object",
                    properties: {
                        message: {
                            type: "string",
                        },
                    },
                },
                SignupRequest: {
                    type: "object",
                    required: ["email", "password"],
                    properties: {
                        email: {
                            type: "string",
                            format: "email",
                        },
                        password: {
                            type: "string",
                            example: "secret123",
                        },
                    },
                },
                LoginRequest: {
                    type: "object",
                    required: ["email", "password"],
                    properties: {
                        email: {
                            type: "string",
                            format: "email",
                        },
                        password: {
                            type: "string",
                            example: "secret123",
                        },
                    },
                },
                RefreshResponse: {
                    type: "object",
                    properties: {
                        accessToken: {
                            type: "string",
                        },
                    },
                },
                AuthSuccessResponse: {
                    type: "object",
                    properties: {
                        message: {
                            type: "string",
                        },
                        accessToken: {
                            type: "string",
                        },
                    },
                },
                MessageResponse: {
                    type: "object",
                    properties: {
                        message: {
                            type: "string",
                        },
                    },
                },
                List: {
                    type: "object",
                    properties: {
                        id: {
                            type: "string",
                        },
                        name: {
                            type: "string",
                        },
                        todos: {
                            type: "array",
                            items: {
                                $ref: "#/components/schemas/Todo",
                            },
                        },
                    },
                },
                ListInput: {
                    type: "object",
                    required: ["name"],
                    properties: {
                        name: {
                            type: "string",
                        },
                    },
                },
                Todo: {
                    type: "object",
                    properties: {
                        id: {
                            type: "string",
                        },
                        listId: {
                            type: "string",
                        },
                        name: {
                            type: "string",
                        },
                        completed: {
                            type: "boolean",
                        },
                    },
                },
                TodoInput: {
                    type: "object",
                    required: ["name"],
                    properties: {
                        name: {
                            type: "string",
                        },
                    },
                },
            },
        },
    },
    apis: [node_path_1.default.join(__dirname, "..", "routes", "*.ts")],
};
const swaggerSpec = (0, swagger_jsdoc_1.default)(options);
exports.swaggerSpec = swaggerSpec;
