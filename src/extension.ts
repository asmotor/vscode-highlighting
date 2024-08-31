/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as vscode from 'vscode';

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


	let documentSymbolProvider: vscode.DocumentSymbolProvider = {
		provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.SymbolInformation[] | vscode.DocumentSymbol[]> {
			var symbols: vscode.SymbolInformation[] = [];
			var scope = "";

			// extract labels
			for (var i = 0; i < document.lineCount; ++i) {
				var line = document.lineAt(i)
				if (line.firstNonWhitespaceCharacterIndex == 0 && !line.isEmptyOrWhitespace) {
					var parts = line.text.split(/\s/).filter(v => v != '');

					if (parts.length >= 1) {
						var label = parts[0];
						var directive: string | null;
						var kind: vscode.SymbolKind = vscode.SymbolKind.Function
						let is_local = label[0] == '.' || label[label.length - 1] == '$';

						// remove trailing colons from label
						while (label[label.length - 1] == ':') {
							label = label.slice(0, label.length - 1);
						}

						// reset scope if not local label
						if (!is_local) {
							scope = "";
						}

						// Determine symbol kind
						if (parts.length >= 2) {
							directive = parts[1].toLowerCase();
							switch (directive) {
								case "equ":
								case "set":
								case "=":
									kind = vscode.SymbolKind.Constant;
									break;
								default:
									kind = vscode.SymbolKind.Function;
									break;
							}
						}

						// add symbol information
						symbols.push(new vscode.SymbolInformation(
							scope + label,
							kind,
							scope,
							new vscode.Location(document.uri, new vscode.Range(i, 0, i, label.length))
						));

						// new scope, if not local label
						if (is_local) {
							kind = vscode.SymbolKind.Key;
						} else {
							scope = label;
						}
					}
				}
			}

			return symbols;
		}
	}

	languageIdentifiers.forEach(language =>
		context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider(
			language,
			documentSymbolProvider
		)));
}
