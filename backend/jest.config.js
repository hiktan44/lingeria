module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  transform: {
    '^.+\\.tsx?$': [
      '@swc/jest',
      {
        jsc: {
          parser: { syntax: 'typescript', tsx: false },
          target: 'es2022',
        },
        module: { type: 'commonjs' },
      },
    ],
  },
};
