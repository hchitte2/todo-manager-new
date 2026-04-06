import path from "node:path";
import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
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
  apis: [path.join(__dirname, "..", "routes", "*.ts")],
};

const swaggerSpec = swaggerJsdoc(options);

export { swaggerSpec };
