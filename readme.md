# Clipboard Manager JS

## Platform support

For windows, this relies on `powershell` and `user32.dll`.

For linux, this relies on a `bash` script and `xdotool`.

Not tested on mac, but should work with something similar to `xdotool` for mac.

If these are not available, most of this will still work, except pressing `enter` (see below) will update the clipboard but not paste its contents. I.e., you can still view clipboard history and select previous contents.  

## keys

`ctrl+shift+v` to trigger the popup.

`up/down` to scroll selection.

`left/right` to select the first/lsat selection.

`enter` to close the popup and paste.

`esc` to close the popup without pasting.

`del/backspace` to remove the selected line.

## screenshots

![1-open.png](./screenshots/1-open.png)

![2-2nd-line-selected.png](./screenshots/2-2nd-line-selected.png)

![3-3rd-line-selected.png](./screenshots/3-3rd-line-selected.png)

![4-pasted.png](./screenshots/4-pasted.png)

![5-selected-text.png](./screenshots/5-selected-text.png)

![6-open-after-copy.png](./screenshots/6-open-after-copy.png)
