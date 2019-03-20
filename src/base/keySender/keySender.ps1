Add-Type @"
    using System;
    using System.Runtime.InteropServices;
    public static class UserWindows {
        [DllImport("user32.dll")] static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);

        public static void keys(int action, byte[] vks) {
            if (action == 1)
                press(vks);
            else if (action == 0)
                release(vks);
            else
                type(vks);
        }

        public static void press(byte[] vks) {
            foreach (byte vk in vks) {
                keybd_event(vk, 0, 0, UIntPtr.Zero);
            }
        }

        public static void release(byte[] vks) {
            foreach (byte vk in vks) {
                keybd_event(vk, 0, 0x2, UIntPtr.Zero);
            }
        }

        public static void type(byte[] vks) {
            foreach (byte vk in vks) {
                keybd_event(vk, 0, 0, UIntPtr.Zero);
                keybd_event(vk, 0, 0x2, UIntPtr.Zero);
            }
        }
    }
"@

$action, $vks = $Args
[UserWindows]::keys($action, $vks)
