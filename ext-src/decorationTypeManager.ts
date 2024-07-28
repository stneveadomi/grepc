import { Subscription, take } from 'rxjs';
import { Rule } from './rules/rule';
import { RuleFactory } from './rules/ruleFactory';
import * as vscode from 'vscode';
import { LocationState, reverseMap } from './rules/locationState';
import { LineRange } from './rules/line-range';
import { DecorationTypeWrapper } from './decorations/decorationType';

export class DecorationTypeManager {
    private _subscriptions: Subscription[] = [];
    private _activeEditor: vscode.TextEditor | undefined = undefined;
    private _disposables: { dispose(): void }[] = [];

    private _ruleToActiveOccurrences = new Map<string, vscode.Range[]>();
    private _oldEnabledRules: Map<LocationState, Rule[]> = new Map();
    private _activeDecorations: Map<
        vscode.TextEditorDecorationType,
        vscode.DecorationOptions[]
    > = new Map();

    /**
     * TextDocument -> LocationState (factory) -> applied rule ids -> DecType
     * This is so that we can effectively clear out rules that are currently applied but shouldn't be.
     * 
     */
    private _documentToActiveDecorationMap: WeakMap<
        vscode.TextDocument, 
        Map<LocationState, Map<string, DecorationTypeWrapper>>
    > = new WeakMap();

    private _visibleEditors: vscode.TextEditor[] = [];

    constructor(
        private _ruleFactories: RuleFactory[],
        private logger: vscode.LogOutputChannel,
    ) {
        for(const ruleFactory of this._ruleFactories) {
            this._oldEnabledRules.set(ruleFactory.location, []);
        }
    }

    private getOldEnabledRuleIdSet(location: LocationState) {
        return new Set(this._oldEnabledRules.get(location)?.map(rule => rule.id));
    }

    enableDecorationDetection() {
        this._ruleFactories.forEach((ruleFactory) => {
            this.logger.info(
                `${ruleFactory.rulesCount} ${reverseMap(ruleFactory.location)} rules loaded.`,
            );
            this.logger.info(
                `${ruleFactory.enabledRulesCount} ${reverseMap(ruleFactory.location)} rules enabled.`,
            );
            this._subscriptions.push(
                ruleFactory.$enabledRules.subscribe({
                    next: (enabledRules: Rule[]) => {
                        this.logger.debug(
                            `[DTM][${reverseMap(ruleFactory.location)}] $enabledRules cast`
                        )
                        
                        const addedRules = enabledRules.filter(rule => !this.getOldEnabledRuleIdSet(ruleFactory.location).has(rule.id));
                        this.logger.debug(`[DTM] $enabled rules - ${addedRules.length} added.`);
                        for(const addedRule of addedRules) {
                            this.logger.debug(`[DTM] newly enabled rule - ${addedRule.id}`);
                            this.updateOccurrencesAcrossDocuments(ruleFactory, addedRule);
                            this.applyRuleDecorationsToVisibleEditors(ruleFactory, addedRule);
                        }

                        const removedRules = this._oldEnabledRules!.get(ruleFactory.location)!.filter(rule => !enabledRules.map(x => x.id).includes(rule.id));
                        this.logger.debug(`[DTM] $enabled rules - ${removedRules.length} removed.`);
                        for(const removedRule of removedRules) {
                            this.logger.debug(`[DTM] newly disabled rule - ${removedRule.id}`);
                            this.clearOccurrencesAcrossDocuments(ruleFactory, removedRule);
                            this.clearRuleDecorationsToVisibleEditors(ruleFactory, removedRule);
                        }

                        //intersection of old and new enabled rules. These were not removed. Check for decoration changes.
                        const unchangedRules = enabledRules.filter(rule => this.getOldEnabledRuleIdSet(ruleFactory.location).has(rule.id));
                        this.logger.debug(`[DTM] $enabled rules - ${unchangedRules.length} unchanged.`);
                        for(const unchangedRule of unchangedRules) {
                            this.logger.debug(
                                `[DTM][${reverseMap(ruleFactory.location)}] unchanged rule - ${unchangedRule.id}`,
                            );
                            for(const document of vscode.workspace.textDocuments) {
                                const activeDecorationMap = this.getActiveDecorationMap(document, ruleFactory.location);
                                const decType = activeDecorationMap.get(document.fileName);
                                if(decType?.needsOccurrenceUpdate(unchangedRule)) {
                                    decType.updateOccurrences(document, unchangedRule);
                                }

                                if(decType?.hasDecorationChanged(unchangedRule)) {
                                    for(const editor of vscode.window.visibleTextEditors) {
                                        decType.applyDecorationsToEditor(editor);
                                    }
                                }
                            }
                        }


                        this._oldEnabledRules.set(
                            ruleFactory.location,
                            enabledRules
                        );
                    },
                }),
            );
        });

        this._activeEditor = vscode.window.activeTextEditor;
        if (this._activeEditor) {
            if (
                this._activeEditor.document.fileName ===
                'stneveadomi.grepc.grepc'
            ) {
                this._activeEditor = undefined;
            } else {
                this.applyDecorationsToEditor(this._activeEditor);
            }
        }

        this.logger.debug('[DTM] Decorating all known text editors at startup.')
        for(const textEditor of vscode.window.visibleTextEditors) {
            this.logger.debug(`[DTM] Initializing text document: ${textEditor.document.save}`);
            this.applyDecorationsToEditor(textEditor);
        }

        vscode.window.onDidChangeVisibleTextEditors(
            (editors) => {
                this.logger.debug('onDidChangeVisibleTextEditors: size ' + editors.length);
                const newVisibleEditors = editors.filter(editor => !this._visibleEditors.includes(editor));

                this.logger.debug('diff: \n', newVisibleEditors.map(editor => editor.document.fileName).join('✔\n') + '✔');

                const notVisibleEditors = this._visibleEditors.filter(editor => !editors.includes(editor));
                this.logger.debug('diff: \n', notVisibleEditors.map(editor => editor.document.fileName).join('❌\n') + '❌');

                this._visibleEditors = Array.from(editors.values());
                
                for(const newEditor of newVisibleEditors) {
                    this.updateOccurrenceData(newEditor.document);
                    this.applyDecorationsToEditor(newEditor)
                }

                for(const notVisibleEditor of notVisibleEditors) {
                    this.clearDecorationsOnEditor(notVisibleEditor);
                }
            }
        );
        
        vscode.window.onDidChangeActiveTextEditor(
            (editor) => {
                this.logger.debug(
                    `[DTM] Active text editor changed from ${this._activeEditor?.document.fileName} to ${editor?.document?.fileName}`,
                );
                this._activeEditor = editor;

                // prevent decorating the grepc log, as this will cause an infinite loop...
                if (
                    this._activeEditor &&
                    this._activeEditor.document.fileName ===
                        'stneveadomi.grepc.grepc'
                ) {
                    this._activeEditor = undefined;
                }

                if(editor && !this._documentToActiveDecorationMap.has(editor.document)) {
                    this.applyDecorationsToEditor(editor);
                }
            },
            this,
            this._disposables,
        );



        vscode.workspace.onDidOpenTextDocument(
            (document: vscode.TextDocument) => {
                this.logger.info(`Document opened: ${document.fileName}`);
                this.logger.info(`Does document match others? ${this._documentToActiveDecorationMap.has(document)}`);
                for(const ruleFactory of this._ruleFactories) {
                    const activeDecorationMap = this.getActiveDecorationMap(document, ruleFactory.location);
                    for(const decType of activeDecorationMap.values()) {
                        decType.updateOccurrences(document);
                    }
                }
            }

        )

        vscode.workspace.onDidCloseTextDocument(
            (document: vscode.TextDocument) => {
                this.logger.info(`Document closed: ${document.fileName}. Cleaning up resources.`);
                for(const ruleFactory of this._ruleFactories) {
                    const activeDecorationMap = this.getActiveDecorationMap(document, ruleFactory.location);
                    for(const decType of activeDecorationMap.values()) {
                        decType.dispose();
                    }
                    activeDecorationMap.clear();
                }
                this._documentToActiveDecorationMap.get(document)?.clear();
                this._documentToActiveDecorationMap.delete(document);
            },
            this,
            this._disposables
        )

        vscode.workspace.onDidChangeTextDocument(
            (event: vscode.TextDocumentChangeEvent) => {
                // Clear old enabled rules to force isDecorationChangeInArray to return true
                // This forces updateDecorations to call.
                if (event.document === this._activeEditor?.document) {
                    this.logger.debug(
                        `[DTM] Text document changed, triggering update decorations on ${event.document.fileName} because of reason: ${event.reason}`,
                        event.contentChanges,
                    );
                    this.generateOccurrencesOnChange(event);
                }
            },
            this,
            this._disposables,
        );
    }

    clearRuleDecorationsToVisibleEditors(ruleFactory: RuleFactory, removedRule: Rule) {
        for(const editor of vscode.window.visibleTextEditors) {
            const activeDecorationMap = this.getActiveDecorationMap(editor.document, ruleFactory.location);
            const decType = activeDecorationMap.get(removedRule.id);
            decType?.clearDecorations(editor);
        }
    }

    clearOccurrencesAcrossDocuments(ruleFactory: RuleFactory, removedRule: Rule) {
        for(const document of vscode.workspace.textDocuments) {
            const activeDecorationMap = this.getActiveDecorationMap(document, ruleFactory.location);
            const decType = activeDecorationMap.get(removedRule.id);
            decType?.clearOccurrenceData();
        }
    }

    disableDecorationDetection() {
        this._subscriptions.forEach((subscription) => {
            subscription.unsubscribe();
        });
    }

    /**
     * Given a document and location, fetch the currently stored mappings to retrieve the following:
     * TextDocument -> ActiveDecorationMap (Location -> (Rule ID -> DecorationType)) -> (Rule ID -> DecorationType)
     * 
     * If the document mapping is not available, it will create it. (as an empty map)
     * If the location mapping is not available, it will create it. (as an empty map)
     * 
     * @param document 
     * @param location 
     * @returns Map of (Rule ID -> DecorationType)
     */
    private getActiveDecorationMap(document: vscode.TextDocument, location: LocationState): Map<string, DecorationTypeWrapper> {
        if(!this._documentToActiveDecorationMap.has(document)) {
            this._documentToActiveDecorationMap.set(document, new Map());
        }
        const activeDecorationMap = this._documentToActiveDecorationMap.get(document);

        if(!activeDecorationMap!.has(location)) {
            activeDecorationMap!.set(location, new Map());
        }
        const appliedRulesToDecorationTypes = activeDecorationMap!.get(location);
        console.debug(this._documentToActiveDecorationMap);
        return appliedRulesToDecorationTypes!;
    }

    /**
     * applyDecorations to the current text editor.
     * 
     * What decorations to apply to the current editor is fetched from this.getActiveDecorationMap().
     * 
     * @param textEditor 
     */
    applyDecorationsToEditor(textEditor: vscode.TextEditor) {
        for(const ruleFactory of this._ruleFactories) {
            const appliedRuleToDecorationMap = this.getActiveDecorationMap(textEditor.document, ruleFactory.location);
            if(!appliedRuleToDecorationMap) {
                this.logger.error(`[DTM] applyDecorations: activeEditors mapped to falsey appliedRuleToDecorationType map.`);
                return;
            }
    
            const enabledRuleIds = new Set();
            ruleFactory.getEnabledRules().forEach(applyRule => {
                // if rule has already been applied.
                let decorationType;
                if(appliedRuleToDecorationMap?.has(applyRule.id) && (decorationType = appliedRuleToDecorationMap.get(applyRule.id))) {
                    if(decorationType.hasDecorationChanged(applyRule)) {
                        //if decorationType has change, update occurrence data.
                        this.logger.debug(`[DTM] applyDecorationsToEditor(): decorationType found. Updating occurrence data.`);
                        decorationType.clearDecorations(textEditor);
                        decorationType.updateOccurrences(textEditor.document, applyRule);
                    }
                    this.logger.debug(`[DTM] Applying decorations to editor: ${textEditor.document.fileName}`);
                    decorationType.applyDecorationsToEditor(textEditor);
                    //if decorationType has not changed, no need to update.
                } else {
                    // if appliedRule does not have a decoration type
                    this.logger.debug(`[DTM] applyDecorationsToEditor(): decorationType not found. Creating one and applying it.`)
                    decorationType = new DecorationTypeWrapper(applyRule);
                    decorationType.updateOccurrences(textEditor.document, applyRule);
                    decorationType.applyDecorationsToEditor(textEditor);
                    appliedRuleToDecorationMap?.set(applyRule.id, decorationType);
                }
                enabledRuleIds.add(applyRule.id);
            });

            // Clear out non-enabled same-factory 
            for(const [ruleId, decType] of appliedRuleToDecorationMap.entries()) {
                if(!enabledRuleIds.has(ruleId)) {
                    decType.clearDecorations(textEditor);
                    decType.dispose();
                }
            }
        }
    }

    generateOccurrencesOnChange(event: vscode.TextDocumentChangeEvent) {
        for(const ruleFactory of this._ruleFactories) {
            const appliedRuleToDecorationMap = this.getActiveDecorationMap(event.document, ruleFactory.location);
            if(appliedRuleToDecorationMap) {
                for(const decorationType of appliedRuleToDecorationMap.values()) {
                    for(const contentChange of event.contentChanges) {
                        decorationType.generateOccurrencesOnChange(contentChange);
                    }                                                                                       
                }
            }
        }
    }

    /**
     * Go through all registered rules to the current document and trigger occurrence data updates.
     * 
     * @param document - the document text to update occurrence data with.
     */
    updateOccurrenceData(document: vscode.TextDocument) {
        for(const ruleFactory of this._ruleFactories) {
            const activeDecorationMap = this.getActiveDecorationMap(document, ruleFactory.location);
            for(const decType of activeDecorationMap.values()) {
                decType.updateOccurrences(document);
            }
        }
    }

    updateOccurrencesAcrossDocuments(ruleFactory: RuleFactory, rule: Rule) {
        for(const document of vscode.workspace.textDocuments) {
            const activeDecorationMap = this.getActiveDecorationMap(document, ruleFactory.location);
            let decorationType;
            if(activeDecorationMap.has(rule.id)) {
                decorationType = activeDecorationMap.get(rule.id);
            } else {
                decorationType = new DecorationTypeWrapper(rule);
                activeDecorationMap.set(rule.id, decorationType);
            }
            decorationType!.updateOccurrences(document);
        }
    }

    applyDecorationsToActiveEditor() {
        if (this._activeEditor) {
            this._activeDecorations.forEach((decorations, decorationType) => {
                this._activeEditor?.setDecorations(decorationType, decorations);
            });
        }
    }

    applyDecorationsToVisibleEditors() {
        for(const textEditor of vscode.window.visibleTextEditors) {
            this.applyDecorationsToEditor(textEditor);
        }
    }

    applyRuleDecorationsToVisibleEditors(ruleFactory: RuleFactory, rule: Rule) {
        for(const editor of vscode.window.visibleTextEditors) {
            const appliedRuleToDecorationMap = this.getActiveDecorationMap(editor.document, ruleFactory.location);
            if(!appliedRuleToDecorationMap.has(rule.id)) {
                this.logger.error(`[DTM] Unable to apply rule to visible editors as no rule decoration map exists.`);
                return;
            }

            const decType = appliedRuleToDecorationMap.get(rule.id);
            decType?.applyDecorationsToEditor(editor);
        }
    }

    private isDecorationChangeInRule(
        rule: Rule,
        location: LocationState,
    ) {
        const matchingOldRule = this._oldEnabledRules.get(location)?.find(oldRule => oldRule.id === rule.id);
        if (!matchingOldRule) {
            // if its an addition, we need to decorate (this case is odd tho).
            return true;
        }

        //check all properties that correspond to needing a decoration update.
        if (
            matchingOldRule.backgroundColor !== rule.backgroundColor ||
            matchingOldRule.border !== rule.border ||
            matchingOldRule.borderColor !== rule.borderColor ||
            matchingOldRule.borderWidth !== rule.borderWidth ||
            matchingOldRule.color !== rule.color ||
            matchingOldRule.cursor !== rule.cursor ||
            matchingOldRule.excludedFiles !== rule.excludedFiles ||
            matchingOldRule.includedFiles !== rule.includedFiles ||
            matchingOldRule.fontStyle !== rule.fontStyle ||
            matchingOldRule.fontWeight !== rule.fontWeight ||
            matchingOldRule.isWholeLine !== rule.isWholeLine ||
            matchingOldRule.maxOccurrences !== rule.maxOccurrences ||
            matchingOldRule.outline !== rule.outline ||
            matchingOldRule.outlineColor !== rule.outlineColor ||
            matchingOldRule.outlineWidth !== rule.outlineWidth ||
            matchingOldRule.overviewRulerColor !==
                rule.overviewRulerColor ||
            matchingOldRule.overviewRulerLane !==
                rule.overviewRulerLane ||
            matchingOldRule.regularExpression !==
                rule.regularExpression ||
            matchingOldRule.regularExpressionFlags !==
                rule.regularExpressionFlags ||
            matchingOldRule.textDecoration !== rule.textDecoration ||
            matchingOldRule.title !== rule.title
        ) {
            return true;
        }

        return false;
    }

    private static toLineRanges(
        ruleId: string,
        ranges: vscode.Range[],
    ): LineRange[] {
        const occurrences: LineRange[] = [];
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            ranges.forEach((range, index) => {
                const lineStart = activeEditor.document.lineAt(range.start.line)
                    .range.start;
                const lineStartOffset =
                    activeEditor.document.offsetAt(lineStart);
                const lineNumbers = [];
                for (let i = range.start.line; i <= range.end.line; i++) {
                    lineNumbers.push(i);
                }
                const lines = lineNumbers.map(
                    (lineNumber) =>
                        activeEditor.document.lineAt(lineNumber).text,
                );
                occurrences.push({
                    ruleId,
                    index,
                    lines,
                    lineNumbers,
                    startIndex:
                        activeEditor.document.offsetAt(range.start) -
                        lineStartOffset,
                    endIndexExcl:
                        activeEditor.document.offsetAt(range.end) -
                        lineStartOffset,
                    selectionNumber: index,
                });
            });
        }

        return occurrences;
    }

    private pushEmptyOccurrenceData() {
        this._ruleFactories.forEach((ruleFactory) => {
            // take 1 and complete, this should be the last value sent as we shareReplay $enabledRules.
            ruleFactory.$enabledRules
                .pipe(take(1))
                .subscribe((enabledRules) => {
                    enabledRules.forEach((rule) =>
                        ruleFactory.pushOccurrences(rule, [], 0),
                    );
                });
        });
        /* Clear active occurrences as we just pushed empty occurrence data. */
        this._ruleToActiveOccurrences.clear();
    }

    /**
     * Clear all set decorations on the given editor.
     * 
     * Note, this will clear the decorations, but it will not remove decoration type data associated with a document.
     * 
     * @param editor - the intended editor to clear data from.
     */
    clearDecorationsOnEditor(editor: vscode.TextEditor) {
        this.logger.debug(`[DTM] clearDecorationsOnEditor: ${editor.document.fileName}`);
        for(const ruleFactory of this._ruleFactories) {
            const activeDecMap = this.getActiveDecorationMap(editor.document, ruleFactory.location);
            for(const decType of activeDecMap.values()) {
                decType.clearDecorations(editor);
            }
        }
    }

    public dispose(): void {
        this._disposables.forEach(disposable => disposable.dispose());
        this.disableDecorationDetection();
    }

    jumpToLine(lineRange: LineRange) {
        const range = this._ruleToActiveOccurrences.get(lineRange?.ruleId)?.[
            lineRange.index
        ];
        if (range) {
            this.logger.debug(
                '[DTM] jumpToLine() - range found, jumping to in editor',
                this._activeEditor,
            );
            if (this._activeEditor) {
                this._activeEditor.revealRange(
                    range,
                    vscode.TextEditorRevealType.AtTop,
                );
            } else {
                this.logger.error(
                    '[DTM] Attempting to jump failed as active editor is nullish. Range:',
                    range,
                );
            }
        }
    }
}
