import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';
import { randomUUID, webcrypto } from 'node:crypto';

setupZoneTestEnv();

// VS Code webviews provide crypto.randomUUID() (secure context), but Jest 29's
// jsdom environment does not. Fill it in from Node for tests only.
if (typeof globalThis.crypto === 'undefined') {
    Object.defineProperty(globalThis, 'crypto', { value: webcrypto });
} else if (typeof globalThis.crypto.randomUUID !== 'function') {
    Object.defineProperty(globalThis.crypto, 'randomUUID', {
        value: randomUUID,
    });
}
