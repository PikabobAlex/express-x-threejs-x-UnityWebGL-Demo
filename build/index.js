"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const https_1 = __importDefault(require("https"));
const socket_io_1 = require("socket.io");
var EConnectionType;
(function (EConnectionType) {
    EConnectionType[EConnectionType["DisplayPortal"] = 0] = "DisplayPortal";
    EConnectionType[EConnectionType["Client"] = 1] = "Client";
    EConnectionType[EConnectionType["Admin"] = 2] = "Admin";
})(EConnectionType || (EConnectionType = {}));
const options = {
// key: fs.readFileSync("src/localhost/key.pem"),
// cert: fs.readFileSync("src/localhost/cert.pem"),
};
const app = (0, express_1.default)();
const server = https_1.default.createServer(options, app);
const io = new socket_io_1.Server(server);
const ConnectionList = [];
app.use("/Build", express_1.default.static("admin/Build"));
app.get("/display_portal", (req, res) => {
    res.sendFile(__dirname + "/portal/index.html");
});
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/client/index.html");
});
io.on("connection", (socket) => {
    var _a;
    if ((_a = socket.handshake.headers.referer) === null || _a === void 0 ? void 0 : _a.includes("display_portal"))
        console.log("display portal connected");
    else {
        socket.emit(socket.id + " connected");
        console.log(socket.id + " connected");
        socket.on("register", (userName) => {
            console.log(`User ${userName} ${socket.id} connected`);
            ConnectionList.push({ id: socket.id, name: userName, score: 0 });
        });
    }
    socket.on("disconnect", (reason, description) => {
        // console.log(reason, socket.id);
        const userID = ConnectionList.findIndex((x) => x.id === socket.id);
        if (userID === -1)
            return;
        const userName = ConnectionList[userID].name;
        ConnectionList.splice(userID, 1);
        console.log(`User ${userName} ${socket.id} disconnected`);
    });
    socket.on("launch", (msg) => {
        io.emit("rocket launch", msg);
    });
});
server.listen(3000, "0.0.0.0", () => {
    console.log("Server listening on port 3000");
});
