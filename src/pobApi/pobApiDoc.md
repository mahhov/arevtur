# Copied from PoB src

- src/HeadlessWrapper.lua (https://github.com/PathOfBuildingCommunity/PathOfBuilding)
- sha1.lua - it's not in the github repo, but it's created in the root dir after installing PoB.

# luajit

Checkout https://github.com/LuaJIT/LuaJIT

- luajit - Compiled onlinux, luajit-2.1.1720049189
    - `make`
- luajit.exe - Cross compiled on linux for windows
    - `cd src`
    - `make HOST_CC="gcc -m32" CROSS=i686-w64-mingw32- TARGET_SYS=Windows`
    - `cp /usr/lib/gcc/i686-w64-mingw32/13-win32/libgcc_s_dw2-1.dll .`
    - IDK if this is the 'proper' way to do it.

# Integration

- pobApi.lua
- pobApi.js 
