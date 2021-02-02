const { app, Menu, Tray, BrowserWindow } = require('electron');
const os = require('os-utils');
const si = require('systeminformation');
const path = require('path');
const { hostname } = require('os');
const activeWindows = require('active-windows');
const iconPath = path.join(__dirname, 'icon.ico');
const isOnline = require('is-online');

let tray = null

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
    app.quit();
}

const createWindow = () => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        center: true,
        maximizable: false,
        resizable: false,
        width: 1000,
        height: 600,
        icon: __dirname + "/icon.ico",
        webPreferences: {
            nodeIntegration: true
        }
    });

    // and load the index.html of the app.
    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    mainWindow.on('close', function(event) {
        if (app.quitting) {
            mainWindow = null
        } else {
            event.preventDefault()
            mainWindow.hide()
        }
    });


    // Open the DevTools.
    //mainWindow.webContents.openDevTools();

    //intervalo de tempo para repetir

    setInterval(async() => {
        await isOnline().then(online => {
            if (online) {
                mainWindow.webContents.send('network', 'Online')
            } else {
                mainWindow.webContents.send('network', 'Offline')
            }
        })
    }, 1000);

    si.system(function(a) {
        mainWindow.webContents.send('model', a.model)
        mainWindow.webContents.send('fabricante', a.manufacturer)
        mainWindow.webContents.send('serial', a.serial)
    })
    si.osInfo(function(h) {
        mainWindow.webContents.send('hostname', h.hostname)
    });
    si.users(function(u) {
        mainWindow.webContents.send('user', u[0].user)
    });
    setInterval(async() => {
        var data = await activeWindows.getActiveWindow()
        mainWindow.webContents.send('processo', data.windowName)
        mainWindow.webContents.send('programa', data.windowClass)
    }, 1000);
    setInterval(() => {
        //Aqui coloco meu código
        os.cpuUsage(function(v) {
            mainWindow.webContents.send('cpu', v * 100)
            mainWindow.webContents.send('ram', os.freememPercentage() * 100)
            mainWindow.webContents.send('total-ram', os.totalmem() / 1024)
        })
    }, 1000);


    //
    tray = new Tray(iconPath)

    let template = [{
            label: 'System Info',
            click() {
                mainWindow.show();
            }
        },
        {
            label: "Sair",
            click() {
                //BrowserWindow.quit();
                tray.destroy();
                mainWindow.destroy();
            }
        }
    ]

    tray.on("click", () => ( /*mainWindow.isVisible() ? mainWindow.hide() :*/ mainWindow.show()));
    const ctxMenu = Menu.buildFromTemplate(template)
    tray.setContextMenu(ctxMenu)
    tray.setToolTip('Systen Info')
        //

};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Inicia o programa junto com o sisteama.
app.setLoginItemSettings({ openAtLogin: true });

// Nome do aplicativo
app.setName = 'System Info';

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.