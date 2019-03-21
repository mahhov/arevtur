Add-Type @"
    using System;
    using System.Runtime.InteropServices;
    public static class UserWindows {
        [DllImport("user32.dll")] static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);

        public static void keys(int[] keys) {
            int action = 0;
            int i = 0;
            int lastActionI = 0;

            while (i < keys.Length) {
                int key = keys[i];
                if (key < 0) {
                    if (action == -4) {
                        i = lastActionI;
                        action = -1;
                    } else
                        action = key;
                    lastActionI = i;
                } else {
                    byte vk = (byte) key;
                    switch (action) {
                        case -1: // release
                            keybd_event(vk, 0, 0x2, UIntPtr.Zero);
                            break;
                        case -2: // press
                        case -4: // combo
                            keybd_event(vk, 0, 0x0, UIntPtr.Zero);
                            break;
                        case -3: // type
                            keybd_event(vk, 0, 0x0, UIntPtr.Zero);
                            keybd_event(vk, 0, 0x2, UIntPtr.Zero);
                            break;
                    }
                }
                i++;
            }
        }
    }
"@

[UserWindows]::keys($Args)
