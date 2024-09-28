import * as vscode from 'vscode';
import { symbolAt } from "./definitions";
import { documentSymbols, lineArraySymbols } from "./document_symbols";
import { fileEndings } from "./constants";


export let completionItemProvider: vscode.CompletionItemProvider = {
    provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem>> {
        return [];
    }
}


