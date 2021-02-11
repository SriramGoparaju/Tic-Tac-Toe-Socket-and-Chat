const socket = io();
const winNotify = document.getElementById("notify-win");
const cellElements = document.querySelectorAll("[data-cell]");
const board = document.getElementById("board");
const player2Symbol = "X";
const player1Symbol = "O";
let oTurn;
const X_CLASS = "x";
const O_CLASS = "o";

const WINNING_COMBINATIONS = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
];

let count = -1;
startGame();

function startGame() {
      count++;
      if (count % 2 === 0) {
            oTurn = true;
      } else {
            oTurn = false;
      }

      cellElements.forEach((cell) => {
            // removing x and o in each cell
            cell.classList.remove(X_CLASS);
            cell.classList.remove(O_CLASS);
            cell.removeEventListener("click", handleClick);
            cell.addEventListener("click", handleClick, { once: true });
      });
      setBoardHoverClass();
}

function setBoardHoverClass() {
      // remove the class so that new game can begin with different player to play
      board.classList.remove(X_CLASS);
      board.classList.remove(O_CLASS);
      if (oTurn) {
            board.classList.add(O_CLASS);
      } else {
            board.classList.add(X_CLASS);
      }
}

function placeMark(cellId, currentClass) {
      let cell = document.getElementById(cellId);
      cell.classList.add(currentClass);
}

// checks if x or o already won
function checkWin(currentClass) {
      return WINNING_COMBINATIONS.some((combination) => {
            return combination.every((index) => {
                  return cellElements[index].classList.contains(currentClass);
            });
      });
}

// if all the cells are filled with x or o returns true
function isDraw() {
      return [...cellElements].every((cell) => {
            return (
                  cell.classList.contains(X_CLASS) ||
                  cell.classList.contains(O_CLASS)
            );
      });
}

function handleClick(e) {
      const cell = e.target;
      const cellId = cell.id;
      const currentClass = oTurn ? O_CLASS : X_CLASS;
      socket.emit("markPlaced", { cellId, currentClass });

      placeMark(cell.id, currentClass);

      if (checkWin(currentClass)) {
            endgame(false);
      } else if (isDraw()) {
            endgame(true);
      }
}

function swapTurns() {
      oTurn = !oTurn;
}

function endgame(draw) {
      socket.emit("gameEnded", "restart");
}

//  change dom for mark is placed and emit to change the turns   ///////////////////////////////
socket.on("changeDom", (msg) => {
      placeMark(msg.cellId, msg.currentClass);
      if (checkWin(msg.currentClass)) {
            endgame(false);
      } else if (isDraw()) {
            endgame(true);
      }
      socket.emit("swapTurn", "mark placed, hence swap turns");
      swapTurns();
});

//       game ended -- restart     ////////////////////////////////////////////////////////////
socket.on("gameEnded", (scores) => {
      swapTurns();
      startGame();
});

////      swap between X and O for the players     /////////////////////////////////////////////
socket.on("swapTurn", (msg) => {
      swapTurns();
      setBoardHoverClass();
});

/////////////////////               CHAT MESSAGES SECTION            ///////////////////////////////////////
const chatForm = document.getElementById("chat-form");
const messageArea = document.querySelector(".messages");

const [username, roomId] = window.location.href.split("/").slice(-2);

socket.emit("joinRoom", { username, roomId });

socket.on("playersReady", (usersArray) => {
      const pointsHead = document.querySelector(".points");
      pointsHead.innerHTML = `${usersArray[0]} vs
            ${usersArray[1]}`;
});

chatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const chatMessage = e.target.elements.formInput.value;
      e.target.elements.formInput.value = "";
      e.target.elements.formInput.focus();
      socket.emit("message", chatMessage);
});

socket.on("message", (msg) => {
      const div = document.createElement("div");
      div.classList.add("message");
      div.innerHTML = "";
      div.innerHTML = ` <span class="header">
            <p>${msg.username}</p>
            <p class="time">${msg.time}</p>
          </span>
          <p class="msg">
            ${msg.message}
          </p>`;

      document.querySelector(".messages").appendChild(div);

      messageArea.scrollTop = messageArea.scrollHeight;
});

socket.on("WelcomeMessage", (msg) => {
      const div = document.createElement("div");
      div.classList.add("message");
      div.innerHTML = "";
      div.innerHTML = ` <span class="header">
            <p>${msg.username}</p>
            <p class="time">${msg.time}</p>
          </span>
          <p class="msg">
            ${msg.message}
          </p>`;

      document.querySelector(".messages").appendChild(div);

      messageArea.scrollTop = messageArea.scrollHeight;
});
