"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const https_1 = __importDefault(require("https"));
const fs_1 = __importDefault(require("fs"));
const socket_io_1 = require("socket.io");
const options = {
    key: fs_1.default.readFileSync("localhost/key.pem"),
    cert: fs_1.default.readFileSync("localhost/cert.pem"),
};
const app = (0, express_1.default)();
const server = https_1.default.createServer(app);
const io = new socket_io_1.Server(server);
const ConnectionList = [];
app.use("/Build", express_1.default.static(__dirname + "\\portal\\Build"));
console.log(__dirname + "/portal/Build");
app.get("/display", (req, res) => {
    res.sendFile(__dirname + "/portal/index.html");
});
// console.log(__dirname + "\\..\\client\\index.html");
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/client/index.html");
});
app.get("/admin", (req, res) => {
    res.sendFile(__dirname + "/admin/index.html");
});
io.on("connection", (socket) => {
    var _a;
    if ((_a = socket.handshake.headers.referer) === null || _a === void 0 ? void 0 : _a.includes("display_portal"))
        console.log("display portal connected");
    else {
        socket.emit(socket.id + " connected");
        console.log(socket.id + " connected");
        socket.on("client register", (userName) => {
            const socketIndex = socket.id;
            console.log(socketIndex);
            console.log(`User ${userName} with socket.id: ${socketIndex} connected`);
            ConnectionList.push({ socketID: socketIndex, userName: userName, score: 0 });
        });
    }
    socket.on("game scored", (info) => {
        const connectionIndex = ConnectionList.findIndex((x) => x.socketID === info.socketID);
        if (connectionIndex === -1) {
            console.log("User not found");
            return;
        }
        ;
        ConnectionList[connectionIndex].score += info.score;
        console.log(ConnectionList[connectionIndex].userName + " scored " + info.score + " points");
    });
    socket.on("disconnect", (reason, description) => {
        // console.log(reason, socket.id);
        const userID = ConnectionList.findIndex((x) => x.socketID === socket.id);
        if (userID === -1)
            return;
        const userName = ConnectionList[userID].userName;
        ConnectionList.splice(userID, 1);
        console.log(`User ${userName} ${socket.id} disconnected`);
        // io.emit("admin sync playerlist", JSON.stringify(ConnectionList));
    });
    socket.on("client launch", (msg) => {
        io.emit("game launch", msg);
    });
    // socket.on("server sync playerlist", () => {
    //     io.emit("admin sync playerlist", JSON.stringify(ConnectionList));
    // });
    socket.on("server sync playerlist", () => {
        io.emit("admin sync playerlist", ConnectionList);
    });
});
server.listen(3000, "0.0.0.0", () => {
    console.log("Server listening on port 3000");
});
