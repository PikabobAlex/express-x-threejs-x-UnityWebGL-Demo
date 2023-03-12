import { io } from "socket.io-client";
import $ from 'jquery';
import Swal from "sweetalert2";
import './style.scss'
import { InitThreeScene, animationAngleTunnerSet, animationButtonPressed, updateGameAngle, updateGameScore, updateUserName } from "./three-scene";
function InitRegisterPopup(un: string) {
  let userName: string = un;
  Swal.fire({
    title: "Welcome to the game!",
    text: "Please enter your name",
    icon: "info",
    input: "text",
    inputPlaceholder: "Enter your name",
    showCancelButton: false,
    confirmButtonText: "Submit",
  }).then((result) => {
    if (result.isConfirmed) {
      userName = result.value;
      StarGame(userName);
    }
  });
}
function StarGame(userName: string) {
  const socket = io();
  socket.on("connect_error", (err) => {
    console.log(`connect_error due to ${err.message}`);
  });
  console.log("userName: " + userName)
  InitThreeScene();
  updateUserName(userName);
  socket.on("connect", () => {
    socket.on(socket.id + " connected", () => {
      console.log(socket.id + "is connected");
      socket.emit("client register", userName);
      const button = document.querySelector(".launchButton") as HTMLButtonElement;
      const angleSlider = document.querySelector("#angle-slider") as HTMLInputElement;
      //@ts-ignore
      let inputTimeout = null
      let ready = true;
      angleSlider.addEventListener("input", function () {
        updateGameAngle(parseInt(angleSlider.value));
        animationAngleTunnerSet(parseFloat(angleSlider.value) / 90);
      })
      button.addEventListener("click", function () {
        if (ready) {
          animationButtonPressed();
          const angle = angleSlider.value;
          console.log(angle);
          socket.emit("client launch", { socketID: socket.id, userName: userName, launchForce: 1.5, launchAngle: angle });
          ready = false;
          inputTimeout = setTimeout(() => {
            ready = true;
          }, 1500);
        }
      });
    });

    socket.on("server message " + socket.id, (data) => {
      console.log(data);
      Swal.fire({
        title: "Server Message",
        text: data,
        icon: "success",
        confirmButtonText: "Cool",
      });
    });

    socket.on("server scored " + socket.id, (data) => {
      console.log("scored: " + data);
      updateGameScore(data);
    })
  });
}
$(function () {
  $.ajax({
    url: "https://randomuser.me/api/",
    dataType: "json",
    success: function (data) {
      const generatedName = data.results[0].name.first + " " + data.results[0].name.last;
      InitRegisterPopup(generatedName);
    },
  });
});

