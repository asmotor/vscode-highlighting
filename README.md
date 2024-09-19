# asmotor-syntax README

ASMotor is a collection of assemblers plus a linker and a librarian. The package supports the CPU families
MOS 6502, Motorola 680x0, Z80 and Game Boy, MIPS32, the FPGA-only RC800 and the virtual DCPU-16. The linker supports several output formats, such as Amiga hunk, Game Boy, Commodore PRG, Sega Master System and more.

This VSCode extension provides syntax highlighting and language support for the ASMotor macro assembler family.

The extension supports the following functionality:

* Go to symbol in editor (Ctrl+Shift+O on Linux)
* Go to definition (F12)
* Peek definition (Ctrl+Shift+F10)
* Display definition to the side (Ctrl+K F12)
* Switch header/source (Alt+O)

Please note that other language extensions may also have registered the Alt+O shortcut, and you may have to correct their "when" clause in the keybinding editor. For clangd, the when clause should be `(resourceLangId == c || resourceLangId == cpp || resourceLangId == cuda-cpp || resourceLangId == objective-c || resourceLangId == objective-cpp) && editorTextFocus`.

ASMotor must be installed separately. It can be found at https://github.com/asmotor/asmotor

<img src="https://raw.githubusercontent.com/asmotor/vscode-highlighting/master/images/z80-example.png" width="400px" />
