"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockResponse = void 0;
const createMockResponse = () => {
    const response = {
        statusCode: 200,
        body: undefined,
        cookiesCleared: [],
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        },
        send() {
            return this;
        },
        clearCookie(name) {
            this.cookiesCleared.push(name);
            return this;
        },
    };
    return response;
};
exports.createMockResponse = createMockResponse;
