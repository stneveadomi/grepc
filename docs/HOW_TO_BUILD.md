This is a guide for building the grepc extension locally.

If you just want to install the extension, this is the wrong place! If you are wanting to fork the repo or contribute on your own, continue on :)

# Steps to build the extension
1. Spin up your favorite terminal
2. Clone the repo to wherever you prefer
	1. e.g. `git clone https://github.com/stneveadomi/grepc.git`
3. Open VS Code in the repository
	1. e.g. `code ./grepc/`
4. You can see all the commands available in `package.json`
5. It is important to understand there are two node repositories within this project.
	1. One is the top level `./`
		1. This is for the extension and its related bootstrap code.
		2. This also contains the code to fetch the SPA
	2. The other is within `./webview-ui/grepc-webview`
		1. This is for the [SPA](https://en.wikipedia.org/wiki/Single-page_application). This is the [webview](https://code.visualstudio.com/api/extension-guides/webview) that runs the UI for the rules (global and local). This is an Angular SPA. 
6. Run `npm install` to pull the packages for both dependencies
	1. Run `npm i` in both the aforementioned directories.
		1. `./`
		2. `./webview-ui/grepc-webview/`
7. Run `npm run vscode:prepublish` in the top level directory.

# How to develop

My setup typically includes two VS Code windows running at the same time.

The first window is in the top level of the directory `./`

The second window is set to be from `./webview-ui/grepc-webview`

## If I am specifically working on the webview?
I mostly just use the second window and run `npm run start` as this runs `ng serve`.

This will run the webview locally from `localhost:4200` and any modifications are live updated to the browser. This will **NOT** run any extension code and will **NOT** update to the extension if it is running.

## If I am specifically working on the extension?
I will just work from the first window and first run `npm run build:spa`. This will build the current state of the spa and **WILL NOT UPDATE IT**.

Then I will use the VS Code build extension.
![image](https://github.com/user-attachments/assets/adea3d9b-3b24-40a1-b46d-2ef4695d1605)

## If I am specifically working on both?
I will have both windows running:
1. Run `npm run watch` in the second window.
2. Run the VS Code build extension

This allows both to react to live changes.
