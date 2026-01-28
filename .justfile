@init:
    npm install
    npm install -g @vscode/vsce ovsx

@package:
    vsce package

@publish ovsx_token:
    -vsce publish
    -npx ovsx publish -p {{ovsx_token}}
