import express from "express";
import http from "https";
import fs from "fs";
import path from "path";
import { Server, Socket, DisconnectReason } from "socket.io";

// U = Unity
// P = Portal
// A = Admin

interface IConnection {
    socketID: string;
    userName: string;
    score: number;
}

interface UGameInfo { socketID: string, userName: string, launchForce: number, launchAngle: number }

const options = {
    key: fs.readFileSync("localhost/key.pem"),
    cert: fs.readFileSync("localhost/cert.pem"),
};

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const ConnectionList: IConnection[] = [];

app.use("/Build", express.static(__dirname + "\\portal\\Build"));
console.log(__dirname + "/portal/Build");

app.get("/display", (req: any, res: any) => {
    res.sendFile(__dirname + "/portal/index.html");
});
// console.log(__dirname + "\\..\\client\\index.html");

app.get("/", (req: any, res: any) => {
    res.sendFile(__dirname + "/client/index.html");
});

app.get("/admin", (req: any, res: any) => {
    res.sendFile(__dirname + "/admin/index.html");
});

io.on("connection", (socket: Socket) => {
    if (socket.handshake.headers.referer?.includes("display_portal"))
        console.log("display portal connected");
    else {
        socket.emit(socket.id + " connected");
        console.log(socket.id + " connected");

        socket.on("client register", (userName: any) => {
            const socketIndex = socket.id
            console.log(socketIndex);
            console.log(`User ${userName} with socket.id: ${socketIndex} connected`);
            ConnectionList.push({ socketID: socketIndex, userName: userName, score: 0 });

        });

    }

    socket.on("game scored", (info: IConnection) => {
        const connectionIndex = ConnectionList.findIndex((x) => x.socketID === info.socketID)
        if (connectionIndex === -1) {
            console.log("User not found");
            return;
        };
        ConnectionList[connectionIndex].score += info.score;
        console.log(ConnectionList[connectionIndex].userName + " scored " + info.score + " points");
    });

    socket.on("disconnect", (reason: DisconnectReason, description: any) => {
        // console.log(reason, socket.id);
        const userID = ConnectionList.findIndex((x) => x.socketID === socket.id)
        if (userID === -1) return;
        const userName = ConnectionList[userID].userName;
        ConnectionList.splice(userID, 1);
        console.log(`User ${userName} ${socket.id} disconnected`);
        // io.emit("admin sync playerlist", JSON.stringify(ConnectionList));
    });

    socket.on("client launch", (msg: UGameInfo) => {
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
