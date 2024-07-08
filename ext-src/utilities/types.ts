import * as vscode from 'vscode';

export type GlobalState = vscode.Memento & {
    setKeysForSync(keys: readonly string[]): void;
};
