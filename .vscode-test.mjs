// .vscode-test.mjs
import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
    files: 'out/test/**/*.test.js',
    download: {
        // @vscode/test-electron allows 15 s, with no retry, for the update service to answer the
        // "which VS Code satisfies engines.vscode" query, and CI has hit that limit. The same value
        // is the idle timeout of the (retried) archive download, so a longer one costs nothing.
        timeout: 60_000,
    },
});
