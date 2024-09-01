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
			if (line.firstNonWhitespaceCharacterIndex == 0 && !line.isEmptyOrWhitespace && line.text[0] != ";") {
				var parts = line.text.split(/\s/).filter(v => v != '');

				if (parts.length >= 1) {
					var label = parts[0];
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
						let directive = parts[1].toLowerCase();
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


	// Return the length of a numeric label at the specified index.
	// A numeric label has the form "n[n...]$"
	function numericLabelLength(line: string, index: number): number {
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

		return 0;
	}


	// Determine if a character is a valid first label character
	function isSymbolStartCharacter(ch: string) {
		return (ch >= "A" && ch <= "Z") || (ch >= "a" && ch <= "z") || ch == "_";
	}


	// Determine if a character is a valid label character
	function isSymbolMiddleCharacter(ch: string) {
		return isSymbolStartCharacter(ch) || (ch >= "0" && ch <= "9");
	}


	// Return the length of an alpha numeric label at index
	function alphaNumericLabelLength(line: string, index: number): number {
		if (index >= line.length)
			return 0;

		let startIndex = index;
		if (isSymbolStartCharacter(line[startIndex])) {
			var endIndex = startIndex + 1;

			while (index < line.length && isSymbolMiddleCharacter(line[endIndex])) {
				endIndex += 1;
			}

			return endIndex - startIndex;
		}

		return 0;
	}


	// Return the length of a local label at index
	function localLabelLength(line: string, index: number): number {
		let startIndex = index;

		if (line[startIndex] == ".") {
			var endIndex = startIndex + 1;
			endIndex += alphaNumericLabelLength(line, endIndex);

			let length = endIndex - startIndex;
			if (length > 1)
				return length;
		}

		return 0;
	}


	// Return the length of label plus an optional local label
	function labelAndLocalLength(line: string, index: number): number {
		let labelLength = alphaNumericLabelLength(line, index);
		if (labelLength > 0) {
			labelLength += localLabelLength(line, index + labelLength);
		}
		return labelLength;
	}


	function symbolLengthAt(line: string, index: number): number {
		let numericLength = numericLabelLength(line, index);
		if (numericLength > 0)
			return numericLength;

		let localLength = localLabelLength(line, index);
		if (localLength > 0)
			return localLength;

		return labelAndLocalLength(line, index);
	}


	// Find the longest label containing position
	function symbolAt(line: string, position: number): string | undefined {
		let cursor = position;
		var bestPosition = -1;
		var longest = -1;

		while (position >= 0) {
			let length = symbolLengthAt(line, position);
			if (length > 0 && position + length >= cursor && length > longest) {
				bestPosition = position;
				longest = length;
			}
			position -= 1;
		}

		if (bestPosition < 0)
			return undefined;

		return line.slice(bestPosition, bestPosition + longest);
	}


	function findSymbolInDocument(document: vscode.TextDocument, scope: string, symbol: string): vscode.Location | undefined {
		// local label in this file only
		var definitions = documentSymbolDefinitions(document);

		for (let definition of definitions) {
			if (definition.containerName == scope && definition.name == symbol) {
				return definition.location;
			}
		}

		return undefined;
	}

	let definitionProvider: vscode.DefinitionProvider = {
		provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Definition | vscode.LocationLink[]> {
			var line = document.lineAt(position.line).text;
			var symbol = symbolAt(line, position.character);

			if (symbol != undefined) {
				var scope = "";
				let dotIndex = symbol.indexOf(".");
				if (dotIndex != -1) {
					scope = symbol.slice(0, dotIndex);
					symbol = symbol.slice(dotIndex, symbol.length);
				}

				if (dotIndex == 0) {
					// local label in this file only
					var definitions = documentSymbolDefinitions(document);
					var lastScopeLine = 0;

					for (let definition of definitions) {
						if (definition.containerName == "") {
							lastScopeLine = definition.location.range.start.line;
						} else if (definition.name == symbol && position.line >= lastScopeLine) {
							return definition.location;
						}
					}
				}

				for (let doc of vscode.workspace.textDocuments) {
					if (doc.languageId.startsWith("asm.")) {
						let location = findSymbolInDocument(doc, scope, symbol);
						if (location != undefined)
							return location;
					}
				}
				
			}

			return null;
		}

	}

	languageIdentifiers.forEach(language =>
		context.subscriptions.push(
			vscode.languages.registerDocumentSymbolProvider(language, documentSymbolProvider),
			vscode.languages.registerDefinitionProvider(language, definitionProvider)
		));
}
