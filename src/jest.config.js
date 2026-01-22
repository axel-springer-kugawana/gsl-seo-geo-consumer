
const {pathsToModuleNameMapper} = require("ts-jest");
const { compilerOptions } = require("./tsconfig.json");



module.exports = {
    preset: "ts-jest",
    roots: ['./'],
    testMatch: ['**/*.test.ts', '**/*.spec.ts', '**/__tests__/**/*.+(ts|tsx|js)'],
    moduleDirectories: ["node_modules", "<rootDir>"],
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest'
    }
};