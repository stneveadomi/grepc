import * as vscode from 'vscode';
import * as path from 'path';

export class GrepcProvider implements vscode.TreeDataProvider<vscode.TreeItem>
{

    private rulesTreeItem = new vscode.TreeItem("RULES", vscode.TreeItemCollapsibleState.Expanded);

	constructor() {
        this.rulesTreeItem.id = "rules";
	}

	getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: vscode.TreeItem): vscode.TreeItem[] {

        if(!element)
        {
            return this.getRootTreeItems();
        }
            

        return [];
	}

    private getRootTreeItems()
    {
        return [this.rulesTreeItem];
    }

}