import { Subject, Subscription } from "rxjs";
import { Rule } from "./rules/rule";
import { RuleFactory } from "./rules/ruleFactory";
import * as vscode from 'vscode';
import debounce from "debounce";
import { LocationState } from "./rules/locationState";

export class DecorationTypeManager {

    private _destroy = new Subject<void>();
    private _decorationSet = new Set<vscode.TextEditorDecorationType>();
    private _subscriptions: Subscription[] = [];
    private _activeEditor: vscode.TextEditor | undefined = undefined;
    private _disposables: {dispose(): void}[] = [];
    private _factoryToDecorations: Map<LocationState, Set<vscode.TextEditorDecorationType>> = new Map();
    private _ruleToDecorationType = new Map<string, vscode.TextEditorDecorationType>();

    constructor(
        private _ruleFactories: RuleFactory[]
    ) {
        _ruleFactories.forEach(factory => {
            this._factoryToDecorations.set(factory.location, new Set());
        });
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
                this.clearAllDecorations();
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
                this.clearAllDecorations();
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
		console.log('Running update decorations for', ruleFactory.location);
        let activeEditor = vscode.window.activeTextEditor;
		if (!activeEditor) {
			return;
		}

        if(activeEditor !== this.lastActiveEditor) {
            this.lastActiveEditor = activeEditor;
            // if a new active editor, clear the decoration type map.
            this._ruleToDecorationType.clear();
        }

        this.clearDecorationsByFactory(ruleFactory);

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
            while((match = regEx.exec(text)) && decorations.length < (rule.maxOccurrences ?? 1000)) {
                const startPos = activeEditor.document.positionAt(match.index);
                const endPos = activeEditor.document.positionAt(match.index + match[0].length);
                const decoration = { 
                    range: new vscode.Range(startPos, endPos), 
                    hoverMessage: `Rule: ${rule.title}`
                };
                decorations.push(decoration);
            }
            ruleFactory.pushOccurrences(rule, decorations.length);
            const textEditorDecorationType = this.getTextEditorDecorationType(rule);
            this._factoryToDecorations.get(ruleFactory.location)?.add(textEditorDecorationType);

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

    clearAllDecorations() {
        this._decorationSet.forEach(decorationType => {
            this._activeEditor?.setDecorations(
                decorationType,
                []
            );
            if(!this._activeEditor) {
                console.error('_active editor is undefined.', decorationType.key);
            }
        });

        this._decorationSet.clear();
    }

    clearDecorations(rule: Rule) {
        if(this._ruleToDecorationType.has(rule.id)) {
            this._activeEditor?.setDecorations(
                this._ruleToDecorationType.get(rule.id)!,
                []
            );
        }
    }

    clearDecorationsByFactory(ruleFactory: RuleFactory) {
        const setDecorations = this._factoryToDecorations.get(ruleFactory.location);
        setDecorations?.forEach(decorationType => {
            this._activeEditor?.setDecorations(
                decorationType,
                []
            );
        });
    }

    getTextEditorDecorationType(rule: Rule): vscode.TextEditorDecorationType {
        // if rule decoration type exists, clear the decorations on it.
        this.clearDecorations(rule);

        const decType = vscode.window.createTextEditorDecorationType({
            backgroundColor: rule.backgroundColor ?? '',
            outline: rule.outline ?? '',
            outlineColor: rule.outlineColor ?? '',
            outlineWidth: rule.outlineWidth ?? '',

            border: rule.border ?? '',
            borderColor: rule.borderColor ?? '',
            borderWidth: rule.borderWidth ?? '',

            color: rule.color ?? '',
            
            fontStyle: rule.fontStyle ?? '',
            fontWeight: rule.fontWeight ?? '',

            textDecoration: rule.textDecoration ?? '',

            cursor: rule.cursor ?? '',
            isWholeLine: rule.isWholeLine ?? false,
            overviewRulerColor: rule.overviewRulerColor ?? '',
            overviewRulerLane: rule.overviewRulerLane ? Number(rule.overviewRulerLane) : vscode.OverviewRulerLane.Full
        });
        
        this._ruleToDecorationType.set(rule.id, decType);
        this._decorationSet.add(decType);
        return decType;
    }
    
    dispose(): void {
        throw new Error("Method not implemented.");
    }
}