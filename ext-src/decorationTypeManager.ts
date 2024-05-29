import { Subject, Subscription } from "rxjs";
import { Rule } from "./rules/rule";
import { RuleFactory } from "./rules/ruleFactory";
import * as vscode from 'vscode';
import debounce from "debounce";
import { LocationState } from "./rules/locationState";
import { LineRange } from "./rules/line-range";

export class DecorationTypeManager {
    private _destroy = new Subject<void>();
    private _decorationSet = new Set<vscode.TextEditorDecorationType>();
    private _subscriptions: Subscription[] = [];
    private _activeEditor: vscode.TextEditor | undefined = undefined;
    private _disposables: {dispose(): void}[] = [];
    private _factoryToDecorations: Map<LocationState, Set<vscode.TextEditorDecorationType>> = new Map();
    private _ruleToDecorationType = new Map<string, vscode.TextEditorDecorationType>();
    private _ruleToActiveOccurrences = new Map<string, vscode.Range[]>();
    private _oldEnabledRules: Rule[] = [];

    constructor(
        private _ruleFactories: RuleFactory[],
        private logger: vscode.LogOutputChannel
    ) {
        _ruleFactories.forEach(factory => {
            this._factoryToDecorations.set(factory.location, new Set());
        });
    }

    enableDecorationDetection() {
		this._ruleFactories.forEach(ruleFactory => {
            this.logger.info(`${ruleFactory.rulesCount} ${ruleFactory.location === LocationState.GLOBAL ? 'global' : 'local'} rules loaded.`);
            this.logger.info(`${ruleFactory.enabledRulesCount} ${ruleFactory.location === LocationState.GLOBAL ? 'global' : 'local'} rules enabled.`);
            this._subscriptions.push(
                ruleFactory.$enabledRules.subscribe({
                    next: (enabledRules: Rule[]) => {
                        if(this.isDecorationChangeInArray(enabledRules)) {
                            this.logger.debug('[DTM] Decoration Detection: decoration update is needed!');
                            this.updateDecorations(enabledRules, ruleFactory);
                            this._oldEnabledRules = enabledRules;
                        } else {
                            this.logger.debug('[DTM] Decoration Detection: No decoration update needed');
                        }
                        
                    }
                })
            );
        });

        this._activeEditor = vscode.window.activeTextEditor;
        if(this._activeEditor) {
            this._triggerUpdateDecorations();
        }
        vscode.window.onDidChangeActiveTextEditor(editor => {
                this.clearAllDecorations();
                // clear all decorations before switching to active editor.
                this._activeEditor = editor;
                
                if(editor) {
                    this.triggerUpdateDecorations();
                } else {
                    this._ruleToDecorationType.clear();
                }
            },
            this,
            this._disposables
        );

        vscode.workspace.onDidChangeTextDocument(event => {
                this.triggerUpdateDecorations();
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
        let activeEditor = vscode.window.activeTextEditor;
        this.logger.debug(`[DTM] Applying decorations to active editor: ${activeEditor?.document?.fileName}`);
		if (!activeEditor) {
			return;
		}

        if(activeEditor !== this.lastActiveEditor) {
            this.lastActiveEditor = activeEditor;
            // if a new active editor, clear the decoration type map.
            this._ruleToDecorationType.clear();
        }

        this.clearDecorationsByFactory(ruleFactory);
        this.logger.debug(`[DTM] Applying ${enabledRules.length} rules to document: ${activeEditor.document.fileName}`);
        enabledRules.forEach(rule => {
            if(rule.excludedFiles) {
                const exclude = new RegExp(rule.excludedFiles);
                if(exclude.test(activeEditor.document.fileName)) {
                    this.logger.debug(`[DTM] Decorations not applied for rule ${rule.title}. Document title does match exclude.`);
                    ruleFactory.pushOccurrences(rule, [], 0);
                    return;
                }
            }
            if(rule.includedFiles) {
                const include = new RegExp(rule.includedFiles);
                if(!include.test(activeEditor.document.fileName)) {
                    this.logger.debug(`[DTM] Decorations not applied for rule ${rule.title}. Document title does not match include.`);
                    ruleFactory.pushOccurrences(rule, [], 0);
                    return;
                }
            }
            if(!rule.regularExpression) {
                ruleFactory.pushOccurrences(rule, [], 0);
                return;
            }
            const regEx = new RegExp(rule.regularExpression, 'g');
            const text = activeEditor.document.getText();
            const decorations: vscode.DecorationOptions[] = [];
            const ranges: vscode.Range[] = [];
            let match;
            let occurrence = 0;
            while((match = regEx.exec(text)) && decorations.length < (rule.maxOccurrences ?? 1000)) {
                occurrence++;
                const startPos = activeEditor.document.positionAt(match.index);
                const endPos = activeEditor.document.positionAt(match.index + match[0].length);
                const range = new vscode.Range(startPos, endPos);
                const decoration = { 
                    range: range, 
                    hoverMessage: `Rule: ${rule.title}\n #${occurrence}`
                };
                decorations.push(decoration);
                ranges.push(range);
            }
            this._ruleToActiveOccurrences.set(rule.id, ranges);
            ruleFactory.pushOccurrences(rule, DecorationTypeManager.toLineRanges(rule.id, ranges), decorations.length);
            const textEditorDecorationType = this.getTextEditorDecorationType(rule);
            this._factoryToDecorations.get(ruleFactory.location)?.add(textEditorDecorationType);

            activeEditor.setDecorations(
                textEditorDecorationType, 
                decorations
            );
        });
	}

    private isDecorationChangeInArray(enabledRules: Rule[]) {
        if(enabledRules.length !== this._oldEnabledRules.length) {
            return true;
        }

        for(let i = 0; i < enabledRules.length; i++) {
            let element = enabledRules[i];
            let matchingOldRule = this._oldEnabledRules[i];
            if(!matchingOldRule || element.id !== matchingOldRule.id) {
                // if different ids, than a reorder happened indicating redecorate.
                return true;
            }

            //check all properties that correspond to needing a decoration update.
            if(matchingOldRule.backgroundColor !== element.backgroundColor
                || matchingOldRule.border !== element.border
                || matchingOldRule.borderColor !== element.borderColor
                || matchingOldRule.borderWidth !== element.borderWidth
                || matchingOldRule.color !== element.color
                || matchingOldRule.cursor !== element.cursor
                || matchingOldRule.excludedFiles !== element.excludedFiles
                || matchingOldRule.includedFiles !== element.includedFiles
                || matchingOldRule.fontStyle !== element.fontStyle
                || matchingOldRule.fontWeight !== element.fontWeight
                || matchingOldRule.isWholeLine !== element.isWholeLine
                || matchingOldRule.maxOccurrences !== element.maxOccurrences
                || matchingOldRule.outline !== element.outline
                || matchingOldRule.outlineColor !== element.outlineColor
                || matchingOldRule.outlineWidth !== element.outlineWidth
                || matchingOldRule.overviewRulerColor !== element.overviewRulerColor
                || matchingOldRule.overviewRulerLane !== element.overviewRulerLane
                || matchingOldRule.regularExpression !== element.regularExpression
                || matchingOldRule.title !== element.title
            ) {
                return true;
            }
        }

        return false;
    }

    private static toLineRanges(ruleId: string, ranges: vscode.Range[]): LineRange[] {
        const occurrences: LineRange[] = [];
        const activeEditor = vscode.window.activeTextEditor;
        if(activeEditor) {
            ranges.forEach((range, index) => {
                const lineStart = activeEditor.document.lineAt(range.start.line).range.start;
                const lineStartOffset = activeEditor.document.offsetAt(lineStart);
                occurrences.push({
                    ruleId,
                    index,
                    line: activeEditor.document.lineAt(range.start.line).text,
                    lineNumber: range.start.line,
                    startIndex: activeEditor.document.offsetAt(range.start) - lineStartOffset,
                    endIndexExcl: activeEditor.document.offsetAt(range.end) - lineStartOffset,
                    selectionNumber: index
                });
            });
        }

        return occurrences;
    }

    private _triggerUpdateDecorations = () => {
        this.clearAllDecorations();
        this._ruleFactories.forEach(ruleFactory => {
            ruleFactory.recastEnabledRules();
        });
    };

    public triggerUpdateDecorations = debounce(this._triggerUpdateDecorations, 300, {immediate: true});

    clearAllDecorations() {
        this._decorationSet.forEach(decorationType => {
            this._activeEditor?.setDecorations(
                decorationType,
                []
            );

            if(!this._activeEditor) {
                this.logger.debug('[DTM] clearAllDecorations()::_active editor is undefined for key: ', decorationType.key);
            }
        });

        this._decorationSet.clear();
        this._ruleToActiveOccurrences.clear();
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

    jumpToLine(lineRange: LineRange) {
        let range = this._ruleToActiveOccurrences.get(lineRange?.ruleId)?.[lineRange.index];
        if(range) {
            this.logger.debug('[DTM] jumpToLine() - range found, jumping to in editor', this._activeEditor);
            if(this._activeEditor) {
                this._activeEditor.revealRange(range, vscode.TextEditorRevealType.AtTop);
            } else {
                this.logger.error('[DTM] Attempting to jump failed as active editor is nullish. Range:', range);
            }
            
        }
    }

}