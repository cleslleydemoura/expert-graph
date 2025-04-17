const { app, BrowserWindow } = require('electron')
const path = require('path');

// loads a web page into a new BrowserWindow
const createWindow = () => {
  const win = new BrowserWindow({
    icon: path.join(__dirname, "src", "graph-app-icon", "/favicon.ico"),
    width: 2000,
    height: 1100,
    resizable: false
  })

  win.loadFile('index.html')
}

// calling the function when the app is ready
app.whenReady().then(() => {
  createWindow()
})