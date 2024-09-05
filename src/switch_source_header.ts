import * as vscode from 'vscode';


export async function switchSourceHeader(context: vscode.ExtensionContext): Promise<void> {
	if (!vscode.window.activeTextEditor)
		return;

	/*
	const uri = vscode.Uri.file(vscode.window.activeTextEditor.document.fileName);

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