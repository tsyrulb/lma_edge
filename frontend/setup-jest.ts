import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

setupZoneTestEnv();

// Configure fast-check for property-based testing
// Minimum 100 iterations per property test
import * as fc from 'fast-check';

fc.configureGlobal({
  numRuns: 100,
  verbose: false,
});
