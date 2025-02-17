# Copied from PoB src

- src/HeadlessWrapper.lua (https://github.com/PathOfBuildingCommunity/PathOfBuilding)
- sha1.lua - it's not in the github repo, but it's created in the root dir after installing PoB.

# luajit

1. Use linux
1. `git clone https://luajit.org/git/luajit.git`
1. `cd luajit/src`
1. Obtaining `luajit` for linux
   1. `make`
   1. `cp luajit <arevtur-path>/src/services/pobApi/`
1. Obtaining `luajit.exe` for windows
   1. `sudo apt install gcc-mingw-w64`
   1. `make clean`
   1. `make HOST_CC="gcc -m32" CROSS=i686-w64-mingw32- TARGET_SYS=Windows`
   1. `cp luajit.exe <arevtur-path>/src/services/pobApi/`
   1. `cp lua51.dll <arevtur-path>/src/services/pobApi/`
   1. `cp /usr/lib/gcc/i686-w64-mingw32/13-win32/libgcc_s_dw2-1.dll <arevtur-path>/src/services/pobApi/`

IDK if this is the 'proper' way to do it.

More documentation: https://github.com/LuaJIT/LuaJIT

# Integration

- pobApi.lua
- pobApi.js 
