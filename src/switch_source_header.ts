import path = require('path');
import { fileEndings } from "./constants";
import * as vscode from 'vscode';


export async function switchSourceHeader(context: vscode.ExtensionContext): Promise<void> {
	if (!vscode.window.activeTextEditor)
		return;

	// Find files with the same basename
	const filename = path.basename(vscode.window.activeTextEditor.document.fileName);
	const pattern = "**/" + path.basename(filename, path.extname(filename)) + ".{" + fileEndings + "}";
	const files = (await vscode.workspace.findFiles(pattern)).sort();

	// Switch to the next similarly named file
	const index = files.map(v => path.basename(v.path)).indexOf(filename);
	if (index != -1) {
		const textDocument = await vscode.workspace.openTextDocument(files[(index + 1) % files.length]);
		vscode.window.showTextDocument(textDocument);
	}
}