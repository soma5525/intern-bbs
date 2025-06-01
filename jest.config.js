// jest.config.js
const nextJest = require("next/jest");

// Providing the path to your Next.js app which will enable loading next.config.js and .env files
const createJestConfig = nextJest({
  dir: "./",
});

// Add any custom config to be passed to Jest
/** @type {import('jest').Config} */
const customJestConfig = {
  // Add more setup options before each test is run
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  // if using TypeScript with a baseUrl set to the root directory then you need the below for alias' to work
  moduleDirectories: ["node_modules", "<rootDir>/"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    // Handle module aliases (this will be automatically configured for you soon)
    // This line should handle all @/ imports, aligning with tsconfig.json
    "^@/(.*)$": "<rootDir>/$1",
    // If you were using CSS Modules directly (not via Next.js's built-in support),
    // you might need something like this, but Next.js usually handles it.
    // '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  // preset: 'ts-jest', // Next.jsのコンパイラを使うため、ts-jestのpresetは不要な場合が多い
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
