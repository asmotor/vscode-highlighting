import * as vscode from 'vscode';

function isWhitespace(ch: string) {
    return ch.match(/\s/)
}


type symbolState = {
    scope: string,
    symbols: vscode.SymbolInformation[]
};


function lineSymbols(line: string, lineNumber: number, uri: vscode.Uri, state: symbolState) {
    if (line != "" && !isWhitespace(line[0]) && line[0] != ";") {
        var parts = line.split(/\s/).filter(v => v != '');

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
                state.scope = "";
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
            state.symbols.push(new vscode.SymbolInformation(
                label,
                kind,
                state.scope,
                new vscode.Location(uri, new vscode.Range(lineNumber, 0, lineNumber, label.length))
            ));

            // new scope, if not local label
            if (is_local) {
                kind = vscode.SymbolKind.Key;
            } else {
                state.scope = label;
            }
        }
    }
}


export function documentSymbols(document: vscode.TextDocument): vscode.SymbolInformation[] {
    var state = {
        scope: "",
        symbols: []
    };

    // extract labels
    for (var i = 0; i < document.lineCount; ++i) {
        var line = document.lineAt(i)
        lineSymbols(line.text, i, document.uri, state);
    }

    return state.symbols;
}


export function lineArraySymbols(document: string[], uri: vscode.Uri): vscode.SymbolInformation[] {
    var state = {
        scope: "",
        symbols: []
    };

    // extract labels
    for (var i = 0; i < document.length; ++i) {
        lineSymbols(document[i], i, uri, state);
    }

    return state.symbols;
}


export let documentSymbolProvider: vscode.DocumentSymbolProvider = {
    provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.SymbolInformation[] | vscode.DocumentSymbol[]> {
        return documentSymbols(document);
    }
}

