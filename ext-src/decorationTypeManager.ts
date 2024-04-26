import { Subject, Subscription } from "rxjs";
import { Rule } from "./rules/rule";
import { RuleFactory } from "./rules/ruleFactory";
import * as vscode from 'vscode';
import debounce from "debounce";

export class DecorationTypeManager {

    private _destroy = new Subject<void>();
    private _subscriptions: Subscription[] = [];
    private _activeEditor: vscode.TextEditor | undefined = undefined;
    private _disposables: {dispose(): void}[] = [];

    constructor(
        private _ruleFactories: RuleFactory[]
    ) {
        
    }

    enableDecorationDetection() {
		this._ruleFactories.forEach(ruleFactory => {
            this._subscriptions.push(
                ruleFactory.$enabledRules.subscribe({
                    next: (enabledRules: Rule[]) => {
                        console.log('updating decorations. enabledRule = ', enabledRules);
                        this.updateDecorations(enabledRules, ruleFactory);
                    }
                })
            );
        });

        vscode.window.onDidChangeActiveTextEditor(editor => {
                console.log('new active editor', editor);
                this._activeEditor = editor;
                if(editor) {
                    this.triggerUpdateDecorations();
                } else {
                    this._ruleToDecorationType.clear();
                }
            },
            this._disposables
        );

        vscode.workspace.onDidChangeTextDocument(event => {
                console.log('new text document', event.document);
                if(this._activeEditor && event.document === this._activeEditor.document) {
                    this.triggerUpdateDecorations();
                }
            },
            this._disposables
        );
	}

    disableDecorationDetection() {
        this._subscriptions.forEach(subscription => {
            subscription.unsubscribe();
        });
    }

    private lastActiveEditor: vscode.TextEditor | undefined = undefined;

    updateDecorations(enabledRules: Rule[], ruleFactory: RuleFactory) {
		console.error('Running update decorations');
        let activeEditor = vscode.window.activeTextEditor;
		if (!activeEditor) {
			return;
		}
        if(activeEditor !== this.lastActiveEditor) {
            this.lastActiveEditor = activeEditor;
            // if a new active editor, clear the decoration type map.
            this._ruleToDecorationType.clear();
        }

        enabledRules.forEach(rule => {
            if(rule.excludedFiles) {
                const exclude = new RegExp(rule.excludedFiles);
                if(exclude.test(activeEditor.document.fileName)) {
                    ruleFactory.pushOccurrences(rule, 0);
                    return;
                }
            }
            if(rule.includedFiles) {
                const include = new RegExp(rule.includedFiles);
                if(!include.test(activeEditor.document.fileName)) {
                    ruleFactory.pushOccurrences(rule, 0);
                    return;
                }
            }
            const regEx = new RegExp(rule.regularExpression, 'g');
            const text = activeEditor.document.getText();
            const decorations: vscode.DecorationOptions[] = [];
            let match;
            while((match = regEx.exec(text))) {
                const startPos = activeEditor.document.positionAt(match.index);
                const endPos = activeEditor.document.positionAt(match.index + match[0].length);
                const decoration = { 
                    range: new vscode.Range(startPos, endPos), 
                    hoverMessage: 'Rule ID: ' + rule.id 
                };
                decorations.push(decoration);
            }
            ruleFactory.pushOccurrences(rule, decorations.length);
            const textEditorDecorationType = this.getTextEditorDecorationType(rule);
            activeEditor.setDecorations(
                textEditorDecorationType, 
                decorations
            );
        });
	}

    private _triggerUpdateDecorations = () => {
        this._ruleFactories.forEach(ruleFactory => {
            ruleFactory.recastEnabledRules();
        });
    };

    public triggerUpdateDecorations = debounce(this._triggerUpdateDecorations, 300);


    clearDecorations(rule: Rule, activeEditor: vscode.TextEditor) {
        if(this._ruleToDecorationType.has(rule.id)) {
            this._activeEditor?.setDecorations(
                this._ruleToDecorationType.get(rule.id)!,
                []
            );
        }
    }

    private _ruleToDecorationType = new Map<string, vscode.TextEditorDecorationType>();
    getTextEditorDecorationType(rule: Rule): vscode.TextEditorDecorationType {
        // if rule decoration type exists, clear the decorations on it.
        if(this._ruleToDecorationType.has(rule.id)) {
            this._activeEditor?.setDecorations(
                this._ruleToDecorationType.get(rule.id)!,
                []
            );
        }

        const decType = vscode.window.createTextEditorDecorationType({
            backgroundColor: rule.backgroundColor ?? '',
            outline: rule.outline ?? '',
            outlineColor: rule.outlineColor ?? '',
            border: rule.border ?? '',
            color: rule.color ?? '',
            //todo: add the rest appropriately.
        });

        this._ruleToDecorationType.set(rule.id, decType);
        return decType;
    }
    
    dispose(): void {
        throw new Error("Method not implemented.");
    }
}