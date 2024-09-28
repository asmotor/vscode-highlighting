import * as vscode from 'vscode';
import { documentSymbolProvider } from "./document_symbols";
import { definitionProvider } from "./definitions";
import { completionItemProvider } from "./completions";
import { switchSourceHeader } from "./switch_source_header";

export function activate(context: vscode.ExtensionContext) {

	let languageIdentifiers = [
		"asm.680x0",
		"asm.6502",
		"asm.6809",
		"asm.dcpu",
		"asm.mips",
		"asm.rc8",
		"asm.schip",
		"asm.z80"
	];


	languageIdentifiers.forEach(language =>
		context.subscriptions.push(
			vscode.languages.registerCompletionItemProvider(language, completionItemProvider),
			vscode.languages.registerDocumentSymbolProvider(language, documentSymbolProvider),
			vscode.languages.registerDefinitionProvider(language, definitionProvider)
		));

	context.subscriptions.push(vscode.commands.registerCommand(
		'asmotor.switchheadersource', () => switchSourceHeader(context)));
}
