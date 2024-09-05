import path = require('path');
import { fileEndings } from "./constants";
import * as vscode from 'vscode';


export async function switchSourceHeader(context: vscode.ExtensionContext): Promise<void> {
	if (!vscode.window.activeTextEditor)
		return;

//	const path = require('path') as path;

	const filename = path.basename(vscode.window.activeTextEditor.document.fileName);
	const basename = path.basename(filename, path.extname(filename));
	const pattern = "**/" + basename + ".{" + fileEndings + "}";
	const files = await vscode.workspace.findFiles(pattern);
	const sorted = files.sort();
	const index = sorted.map(v => path.basename(v.path)).indexOf(filename);
	if (index != -1) {
		const nextDocument = sorted[(index + 1) % sorted.length];
		const textDocument = await vscode.workspace.openTextDocument(nextDocument);
		vscode.window.showTextDocument(textDocument);
	}


	/*
	let dotPosition = filename.lastIndexOf(".");
	let dotPosition = filename.lastIndexOf(".");


	const docIdentifier = vscodelc.TextDocumentIdentifier.create(uri.toString());
	const sourceUri =
		await client.sendRequest(SwitchSourceHeaderRequest.type, docIdentifier);
	if (!sourceUri) {
	vscode.window.showInformationMessage('Didn\'t find a corresponding file.');
	return;
	}
	const doc =
		await vscode.workspace.openTextDocument(vscode.Uri.parse(sourceUri));
	vscode.window.showTextDocument(doc);
	*/
}