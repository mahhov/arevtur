Add-Type @"
	using System;
	using System.Runtime.InteropServices;
	using System.Collections.Generic;

	public static class UserWindows {
		[DllImport("user32.dll")] static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);

		private const int ACTION_RELEASE = -1;
		private const int ACTION_PRESS = -2;
		private const int ACTION_TYPE = -3;
		private const int ACTION_COMBO = -4;
		private const int ACTION_END = -5;

		public static void keys(List<int> keys) {
			keys.Add(ACTION_END);

			int action = 0;
			int i = 0;
			int lastActionI = 0;

			while (i < keys.Count) {
				int key = keys[i];
				if (key < 0) {
					if (action == ACTION_COMBO) {
						i = lastActionI;
						action = ACTION_RELEASE;
					} else
						action = key;
					lastActionI = i;
				} else {
					byte vk = (byte) key;
					switch (action) {
						case ACTION_RELEASE:
							keybd_event(vk, 0, 0x2, UIntPtr.Zero);
							break;
						case ACTION_PRESS:
						case ACTION_COMBO:
							keybd_event(vk, 0, 0x0, UIntPtr.Zero);
							break;
						case ACTION_TYPE:
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

foreach ($i in $input) {
	[UserWindows]::keys($i.split(","))
}
