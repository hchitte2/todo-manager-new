module.exports = {
  rootDir: ".",
  roots: ["<rootDir>/dist/tests"],
  testEnvironment: "node",
  testMatch: ["**/*.test.js"],
  clearMocks: true,
  watchman: false,
};
