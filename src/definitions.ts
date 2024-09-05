import * as vscode from 'vscode';
import { documentSymbols, lineArraySymbols } from "./document_symbols";
import { fileEndings } from "./constants";

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


function findSymbol(definitions: vscode.SymbolInformation[], scope: string, symbol: string): vscode.Location | undefined {
    for (let definition of definitions) {
        if (definition.containerName == scope && definition.name == symbol) {
            return definition.location;
        }
    }

    return undefined;
}


function findSymbolInDocument(document: vscode.TextDocument, scope: string, symbol: string): vscode.Location | undefined {
    var definitions = documentSymbols(document);
    return findSymbol(definitions, scope, symbol);
}


function findSymbolInLineArray(lines: string[], uri: vscode.Uri, scope: string, symbol: string): vscode.Location | undefined {
    var definitions = lineArraySymbols(lines, uri);
    return findSymbol(definitions, scope, symbol);
}


function findLocalSymbolLocation(document: vscode.TextDocument, scope: string, symbol: string, line: number): vscode.Location | undefined {
    // local label in this file only
    var definitions = documentSymbols(document);
    var lastScopeLine = 0;

    for (let definition of definitions) {
        if (definition.containerName == "") {
            lastScopeLine = definition.location.range.start.line;
        } else if (definition.name == symbol && line >= lastScopeLine) {
            return definition.location;
        }
    }

    return undefined;
}


export let definitionProvider: vscode.DefinitionProvider = {
    async provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Definition | vscode.LocationLink[] | null> {
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
                let location = findLocalSymbolLocation(document, scope, symbol, position.line);
                if (location != undefined)
                    return location;
            }

            let asmDocuments = vscode.workspace.textDocuments.filter(v => v.languageId.startsWith("asm."));
            for (let doc of asmDocuments) {
                let location = findSymbolInDocument(doc, scope, symbol);
                if (location != undefined)
                    return location;
            }

            for (let fileUri of await vscode.workspace.findFiles("**/*.{" + fileEndings + "}")) {
                let bytes = await vscode.workspace.fs.readFile(fileUri);
                let text = new TextDecoder("latin1").decode(bytes);
                let lines = text.split("\n");

                let location = findSymbolInLineArray(lines, fileUri, scope, symbol);
                if (location != undefined)
                    return location;
            }
        }

        return null;
    }
}

