type JsonValue = unknown;

interface MockResponse {
  statusCode: number;
  body: JsonValue;
  cookiesCleared: string[];
  status: (code: number) => MockResponse;
  json: (payload: JsonValue) => MockResponse;
  send: () => MockResponse;
  clearCookie: (name: string) => MockResponse;
}

const createMockResponse = (): MockResponse => {
  const response: MockResponse = {
    statusCode: 200,
    body: undefined,
    cookiesCleared: [],
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: JsonValue) {
      this.body = payload;
      return this;
    },
    send() {
      return this;
    },
    clearCookie(name: string) {
      this.cookiesCleared.push(name);
      return this;
    },
  };

  return response;
};

export { createMockResponse, type MockResponse };
