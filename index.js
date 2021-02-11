//Requiring Modules
const express = require("express");
const path = require("path");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const http = require("http");
const socketio = require("socket.io");
const { text } = require("body-parser");
const shortID = require("shortid");

const formatMessages = require("./utils/messages");
const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// ****************          Middlewares   **************************************///////////////
app.use(bodyParser.urlencoded({ extended: false }));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

//Routing///////////////////////////////////////////////////////////////////////////////////////
app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/join", (req, res) => {
	res.sendFile(path.join(__dirname, "public", "joinRoom.html"));
});

const roomIds = {};

app.post("/", (req, res) => {
	const playerUsername = req.body.username;
	const roomId = shortID.generate();
	roomIds[roomId] = [];
	roomIds[roomId].push(playerUsername);
	res.redirect(`/game/${playerUsername}/${roomId}`);
});

app.post("/join", (req, res) => {
	const username = req.body.username;
	const roomId = req.body.roomPassword;
	if (roomId in roomIds) {
		if (roomIds[roomId].length == 1) {
			roomIds[roomId].push(username);
			res.redirect(`/game/${username}/${roomId}`);
		} else {
			res.redirect("/join");
		}
	} else {
		res.redirect("/join");
	}
});

app.get("/game/:username/:roomId", (req, res) => {
	const username = req.params.username;
	const roomId = req.params.roomId;

	if (!(roomId in roomIds)) {
		res.redirect("/");
	} else {
		if (roomIds[roomId].length === 1) {
			res.render("game.ejs", {
				player1: username,
				player2: "Opponent",
			});
		} else {
			res.render("game.ejs", {
				player1: username,
				player2: roomIds[roomId][0],
			});
		}
	}
});

io.on("connection", (socket) => {
	// when a player joins the room
	socket.on("joinRoom", ({ username, roomId }) => {
		socket.join(roomId);

		// welcome the player connected and send everyone else that new player connected
		socket.emit(
			"message",
			formatMessages(
				"Admin",
				`Welcome ${username}, to Tic tac toe. The game code is ${roomId} `
			)
		);

		socket.broadcast
			.to(roomId)
			.emit(
				"message",
				formatMessages("Admin", `${username} has joined the game`)
			);

		if (roomIds[roomId].length === 2) {
			io.to(roomId).emit("playersReady", roomIds[roomId]);
			io.to(roomId).emit(
				"message",
				formatMessages(
					"Admin",
					`Players ready. Start the game. ${roomIds[roomId][0]} is O and ${roomIds[roomId][1]} is X`
				)
			);
		}

		socket.on("message", (msg) => {
			io.to(roomId).emit("message", formatMessages(username, msg));
		});

		// emits when mark is placed by player 1
		socket.on("markPlaced", (msg) => {
			io.to(roomId).emit("changeDom", msg);
		});

		socket.on("swapTurn", (msg) => {
			io.to(roomId).emit("swapTurn", "change the turn");
		});

		socket.on("gameEnded", (msg) => {
			io.to(roomId).emit("gameEnded", "restart");
		});
	});
});

//   Listening on the Port       ///////////////////////////////////////////////////////////////
server.listen(PORT, () => {
	console.log(`The server listening at port ${PORT}`);
});
