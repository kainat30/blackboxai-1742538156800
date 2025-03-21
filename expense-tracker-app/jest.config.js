module.exports = {
  // Basic Jest configuration
  verbose: true,
  testEnvironment: 'node',
  testTimeout: 30000,

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/'
  ],

  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: [
    'json',
    'text',
    'lcov',
    'clover',
    'html'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
    '/tests/',
    '/__mocks__/'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // Module configuration
  moduleFileExtensions: ['js', 'json'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },

  // Transform configuration
  transform: {
    '^.+\\.js$': 'babel-jest'
  },

  // Setup files
  setupFiles: ['<rootDir>/tests/setup.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setupAfterEnv.js'],

  // Environment variables
  globals: {
    NODE_ENV: 'test'
  },

  // Mock configuration
  clearMocks: true,
  resetMocks: false,
  restoreMocks: true,

  // Watch configuration
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/'
  ],

  // Snapshot configuration
  snapshotSerializers: [],
  snapshotFormat: {
    escapeString: true,
    printBasicPrototype: false
  },

  // Error handling
  bail: 1,
  errorOnDeprecated: true,

  // Performance
  maxConcurrency: 5,
  maxWorkers: '50%',

  // Reporting
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'reports/junit',
        outputName: 'js-test-results.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true
      }
    ]
  ],

  // Test environment configuration
  testEnvironmentOptions: {
    url: 'http://localhost'
  },

  // Timing
  slowTestThreshold: 5,
  timers: 'real',

  // Display configuration
  verbose: true,
  silent: false,

  // Cache configuration
  cache: true,
  cacheDirectory: '.jest-cache',

  // Other configurations
  detectLeaks: true,
  detectOpenHandles: true,
  errorOnDeprecated: true,
  forceCoverageMatch: [],
  prettierPath: require.resolve('prettier'),
  
  // Project configuration
  projects: undefined,
  roots: [
    '<rootDir>'
  ],
  
  // Test sequencing
  randomize: true,
  runInBand: false,
  sequential: false,

  // Miscellaneous
  passWithNoTests: false,
  notify: true,
  notifyMode: 'failure-change'
};
