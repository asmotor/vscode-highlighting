@init:
    npm install
    npm install -g @vscode/vsce

@package:
    vsce package

@publish:
    vsce publish
