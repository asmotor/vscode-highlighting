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


	function documentSymbolDefinitions(document: vscode.TextDocument): vscode.SymbolInformation[] {
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
						label,
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


	let documentSymbolProvider: vscode.DocumentSymbolProvider = {
		provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.SymbolInformation[] | vscode.DocumentSymbol[]> {
			return documentSymbolDefinitions(document);
		}
	}

	function symbolLengthAt(line: string, index: number): number {
		let startIndex = index;

		if (line[startIndex] >= "0" && line[startIndex] <= "9") {
			var endIndex = startIndex + 1;
			while (line[endIndex] >= "0" && line[endIndex] <= "9") {
				endIndex += 1;
			}
			if (line[endIndex] == "$") {
				return endIndex - startIndex + 1;
			}
		}

		var endIndex = startIndex;
		if (line[endIndex] == ".") {
			if (isSymbolStartCharacter(line[endIndex + 1]))
				endIndex += 1;
		}

		return 0;
	}

	function isSymbolStartCharacter(ch: string) {
		return (ch >= "A" && ch <= "Z") || (ch >= "a" && ch <= "z") || ch == "_";
	}


	function isSymbolStartOrLocalCharacter(ch: string) {
		return isSymbolStartCharacter(ch) || ch == ".";
	}


	function isSymbolMiddleCharacter(ch: string) {
		return isSymbolStartCharacter(ch) || (ch >= "0" && ch <= "9");
	}


	function isSymbolAnyCharacter(ch: string) {
		return isSymbolMiddleCharacter(ch) || ch == "." || ch == "$";
	}


	function symbolAt(line: string, position: number): string | null {
		// grab possible symbol
		var start = position;

		if (start > 0 && start == line.length)
			start -= 1;

		if (!isSymbolAnyCharacter(line[start]))
			return null;

		while (start > 0) {
			if (line[start] == ".")
				break;
		
			var prevChar = line[start - 1];

			if (isSymbolStartOrLocalCharacter(prevChar)) {
				start -= 1;
			} else if (isSymbolAnyCharacter(prevChar) && isSymbolStartOrLocalCharacter(line[start - 2])) {
				start -= 1;
			} else {
				break;
			}
		}

		var end = position;
		while (end < line.length - 1) {
			if (line[end] == "$")
				break;
		
			var nextChar = line[end + 1];

			if (isSymbolAnyCharacter(nextChar) || nextChar == "$") {
				end += 1;
			} else {
				break;
			}
		}

		return line.slice(start, end + 1);
	}


	let definitionProvider: vscode.DefinitionProvider = {
		provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Definition | vscode.LocationLink[]> {
			var line = document.lineAt(position.line).text;
			var symbol = symbolAt(line, position.character);

			return null;
		}

	}

	languageIdentifiers.forEach(language =>
		context.subscriptions.push(
			vscode.languages.registerDocumentSymbolProvider(language, documentSymbolProvider),
			vscode.languages.registerDefinitionProvider(language, definitionProvider)
		));
}
