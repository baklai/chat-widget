$(function() {
  // Инициализация переменных
  var chat = null;
  var username = null;

  var connected = false;
  var typing = false;
  var lastTypingTime;

  var FADE_TIME = 150;
  var TYPING_TIMER_LENGTH = 400;

  function CHATROOM(username, callback) {
    var RECONNECT_COUNT = 1;
    var MAX_RECONNECT_COUNT = 5;
    var chat = io.connect(
      window.location.protocol +
        "//" +
        window.location.hostname +
        ":" +
        window.location.port +
        "/chat"
    );

    chat.emit("add user", username);

    this.sendUsername = function() {
      // При подключении сообщать серверу имя пользователя
      chat.emit("add user", username);
    };

    this.newMessage = function(message) {
      chat.emit("new message", message);
    };

    this.typing = function() {
      chat.emit("typing");
    };

    this.stopTyping = function() {
      chat.emit("stop typing");
    };

    this.exitChat = function(callback) {
      chat.disconnect();
      if (typeof callback === "function") {
        callback();
      }
    };

    // События сокета
    // Всякий раз, когда сервер выдает «логин», зарегистририруем сообщение входа
    chat.on("login", function(data) {
      connected = true;
      // Вывод приветственного сообщения
      var message = "Добро пожаловать в чат";
      log(message, { prepend: true });
      addParticipantsMessage(data);
    });

    // Всякий раз, когда сервер отправляет новое сообщение, обновляем тело чата
    chat.on("new message", function(data) {
      addChatMessage(data);
    });

    // Всякий раз, когда сервер отправляет «пользователь вошел», зарегистрируем его в теле чата
    chat.on("user signin", function(data) {
      log(data.username + " присоеденился");
      addParticipantsMessage(data);
    });

    // Всякий раз, когда сервер отправляет «пользователь вышел», запишите его в теле чата
    chat.on("user signout", function(data) {
      log(data.username + " вышел");
      addParticipantsMessage(data);
      removeChatTyping(data);
    });

    // Всякий раз, когда сервер сообщает «ввод», покажите сообщение ввода
    chat.on("typing", function(data) {
      addChatTyping(data);
    });

    // Всякий раз, когда сервер сообщает «ввод остановлен», убираем сообщение ввода
    chat.on("stop typing", function(data) {
      removeChatTyping(data);
    });

    chat.on("disconnect", function() {
      log("вы были отключены");
    });

    chat.on("reconnect", function() {
      log("вы были повторно подключены");
      if (username) {
        chat.emit("add user", username);
      }
      RECONNECT_COUNT = 0;
    });

    chat.on("reconnect_error", function() {
      RECONNECT_COUNT++;
      if (RECONNECT_COUNT >= MAX_RECONNECT_COUNT) {
        chat.disconnect();
        log("попытка повторного подключения не удалась");
        log("вы окончательно отключены");
      }
    });

    if (typeof callback === "function") {
      callback();
    }
  }

  document
    .getElementsByClassName("art-chat-widget")[0]
    .addEventListener("click", function() {
      var chatRoom = document.getElementsByClassName("art-chat-room")[0];
      if (!chatRoom.style.display || chatRoom.style.display === "none") {
        $(".art-chat-room").fadeIn(300);
      } else {
        $(".art-chat-room").fadeOut(300);
      }
      if (!username) {
        document
          .getElementsByClassName("box-footer")[0]
          .setAttribute("disabled", true);

        document.getElementsByClassName("art-chat-input-messages")[0].value =
          "";

        document.getElementsByClassName("box-body")[0].innerHTML =
          '<div class="art-chat-auth">' +
          '<h2 class="mb-4">Sign In</h2>' +
          '<div class="input-group mb-4 pr-3 pl-3">' +
          '<div class="input-group-prepend">' +
          '<span class="input-group-text">' +
          '<img width="21" height="21" src="/widgets/chat/img/chat-user.png"/>' +
          "</span>" +
          "</div>" +
          '<input type="text" name="login"' +
          'class="form-control art-chat-input-login"' +
          'placeholder="введите свое имя..."/>' +
          "</div>" +
          '<button class="btn btn-primary art-chat-login-btn">ВОЙТИ</button>' +
          "</div>";

        document.getElementsByClassName("art-chat-input-login")[0].focus();

        document
          .getElementsByClassName("art-chat-login-btn")[0]
          .addEventListener("click", function() {
            username = cleanInput(
              document.getElementsByClassName("art-chat-input-login")[0].value
            );
            if (username) {
              document.getElementsByClassName("box-body")[0].innerHTML =
                '<div class="art-chat-messages"></div>';

              chat = new CHATROOM(username);

              document
                .getElementsByClassName("art-chat-input-messages")[0]
                .focus();

              document
                .getElementsByClassName("art-chat-messages")[0]
                .addEventListener("click", function() {
                  document
                    .getElementsByClassName("art-chat-input-messages")[0]
                    .focus();
                });

              document
                .getElementsByClassName("art-chat-input-messages")[0]
                .addEventListener("keydown", function(event) {
                  if (event.which === 13) {
                    if (username) {
                      sendMessage();

                      chat.stopTyping();

                      typing = false;
                    } else {
                      setUsername();
                    }
                  }
                });

              document
                .getElementsByClassName("art-chat-input-messages")[0]
                .addEventListener("input", function(event) {
                  updateTyping();
                });
              document
                .getElementsByClassName("box-footer")[0]
                .removeAttribute("disabled");
            }
          });

        document
          .getElementsByClassName("art-chat-input-login")[0]
          .addEventListener("keydown", function(event) {
            if (event.which === 13) {
              document.getElementsByClassName("art-chat-login-btn")[0].click();
            }
          });
      } else {
        document.getElementsByClassName("art-chat-input-messages")[0].focus();
      }
    });

  document
    .getElementsByClassName("btn-chat-hide")[0]
    .addEventListener("click", function() {
      $(".art-chat-room").fadeOut(300);
    });

  document
    .getElementsByClassName("btn-chat-exit")[0]
    .addEventListener("click", function() {
      $(".art-chat-room").fadeOut(0);
      if (chat != null) {
        chat.exitChat(function() {
          document.getElementsByClassName("art-chat-messages")[0].remove();
        });
      }
      username = null;
      chat = null;
    });

  document
    .getElementsByClassName("btn-chat-send")[0]
    .addEventListener("click", function() {
      if (event.which === 13) {
        if (username) {
          sendMessage();

          chat.stopTyping();

          typing = false;
        } else {
          setUsername();
        }
      }
    });

  var addParticipantsMessage = function(data) {
    var message = "";
    if (data.chatUsers === 1) {
      message += "в чате 1 участник";
    } else {
      message += "в чате " + data.chatUsers + " участника";
    }
    log(message);
  };

  // Отправляем сообщение в чат
  var sendMessage = function() {
    var message = document.getElementsByClassName("art-chat-input-messages")[0]
      .value;
    // Запретить ввод разметки в сообщение
    message = cleanInput(message);
    // если есть непустое сообщение и соединение сокета
    if (message && connected) {
      document.getElementsByClassName("art-chat-input-messages")[0].value = "";
      addChatMessage({
        username: username,
        message: message
      });
      // укажем серверу на выполнение «нового сообщения» и отправим один параметр
      chat.newMessage(message);
    }
  };

  // Записываем сообщение
  var log = function(message, options) {
    var $el = $("<p>")
      .addClass("art-chat-feedback")
      .text(message);
    addMessageElement($el, options);
  };

  var logTyping = function(data) {
    $("p.art-chat-typing").text(data.username + " " + data.message);
  };

  // Добавляем визуальное сообщение чата в список сообщений
  var addChatMessage = function(data, options) {
    var myAudio = new Audio(); // создание экземпляра класса Audio
    myAudio.src = "/widgets/chat/sound/msg.mp3"; // назначение звукового файла
    myAudio.play(); // воспроизвести звук

    // Не убирать сообщение в том случае, если есть «X»,
    var $typingMessages = getTypingMessages(data);
    options = options || {};
    if ($typingMessages.length !== 0) {
      options.fade = false;
      $typingMessages.remove();
    }

    // var messageSmilies = data.message.match(smileyReg) || [];
    // for (var i = 0; i < messageSmilies.length; i++) {
    //   var messageSmiley = messageSmilies[i],
    //     messageSmileyLower = messageSmiley.toLowerCase();
    //   if (smiliesMap[messageSmileyLower]) {
    //     data.message = data.message.replace(
    //       messageSmiley,
    //       '<img src="/chat/img/smileys/' +
    //         smiliesMap[messageSmileyLower] +
    //         '.gif">'
    //     );
    //   }
    // }

    function addZero(i) {
      if (i < 10) {
        i = "0" + i;
      }
      return i;
    }

    function formatDate(date) {
      // var year = date.getFullYear().toString();
      // var month = (date.getMonth() + 101).toString().substring(1);
      // var day = (date.getDate() + 100).toString().substring(1);
      var hh = addZero(date.getHours());
      var mm = addZero(date.getMinutes());
      return hh + ":" + mm;
    }

    var msg = "";
    if (data.username !== username) {
      // Message. Default to the left
      msg =
        '<div class="art-chat-msg">' +
        '<div class="art-chat-info clearfix">' +
        '<span class="art-chat-name pull-left">' +
        data.username +
        "</span>" +
        '<span class="art-chat-timestamp pull-right">' +
        formatDate(new Date()) +
        "</span>" +
        "</div>" +
        '<img class="art-chat-img" src="/widgets/chat/img/chat-user.png"/>' +
        '<div class="art-chat-text">' +
        data.message +
        "</div>" +
        "</div>";
    } else {
      msg =
        // Message to the right
        '<div class="art-chat-msg right">' +
        '<div class="art-chat-info clearfix">' +
        '<span class="art-chat-name pull-right">' +
        data.username +
        "</span>" +
        '<span class="art-chat-timestamp pull-left">' +
        formatDate(new Date()) +
        "</span>" +
        "</div>" +
        '<img class="art-chat-img" src="/widgets/chat/img/chat-user.png"/>' +
        '<div class="art-chat-text">' +
        data.message +
        "</div>" +
        "</div>";
    }

    addMessageElement(msg, options);
  };

  // Добавляет сообщение ввода
  var addChatTyping = function(data) {
    data.typing = true;
    data.message = "набирает сообщение...";
    logTyping(data);
  };

  // Удаляет сообщение ввода визуального чата
  var removeChatTyping = function(data) {
    $("p.art-chat-typing").text("");
  };

  // Добавляет элемент сообщения в сообщения и прокручивает вниз
  // el - элемент для добавления в качестве сообщения
  // options.fade - если элемент должен исчезать (по умолчанию = true)
  // options.prepend - если элемент должен быть добавлен
  // все другие сообщения (по умолчанию = false)
  var addMessageElement = function(el, options) {
    var $el = $(el);
    // Настройка параметров по умолчанию
    if (!options) {
      options = {};
    }
    if (typeof options.fade === "undefined") {
      options.fade = true;
    }
    if (typeof options.prepend === "undefined") {
      options.prepend = false;
    }

    var messages = document.getElementsByClassName("art-chat-messages")[0];

    // Применение опций
    if (options.fade) {
      $el.hide().fadeIn(FADE_TIME);
    }
    if (options.prepend) {
      // messages.prepend($el);
      $(".art-chat-messages").prepend($el);
    } else {
      //  messages.append($el);
      $(".art-chat-messages").append($el);
    }
    messages.scrollTop = messages.scrollHeight;
  };

  // Предотвращает ввод с помощью инъекции разметки
  var cleanInput = function(input) {
    return $("<div/>")
      .text(input)
      .html();
  };

  // Обновляет событие ввода
  var updateTyping = function() {
    if (connected) {
      if (!typing) {
        typing = true;

        chat.typing();
      }
      lastTypingTime = new Date().getTime();
      setTimeout(function() {
        var typingTimer = new Date().getTime();
        var timeDiff = typingTimer - lastTypingTime;
        if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
          chat.stopTyping();

          typing = false;
        }
      }, TYPING_TIMER_LENGTH);
    }
  };

  // Получает сообщения «X набирает» пользователя
  var getTypingMessages = function(data) {
    return $(".typing.message").filter(function(i) {
      return $(this).data("username") === data.username;
    });
  };
});

// var smiliesMap = {
//   ":)": "1",
//   ":(": "2",
//   ";)": "3",
//   ":d": "4",
//   ";;)": "5",
//   ":/": "7",
//   ":x": "8",
//   ":p": "10",
//   ":*": "11",
//   ":o": "13",
//   ":>": "15",
//   ":s": "17",
//   ":((": "20",
//   ":))": "21",
//   ":|": "22",
//   ":b": "26",
//   ":&": "31",
//   ":$": "32",
//   ":?": "39",
//   "#o": "40",
//   ":ss": "42",
//   "@)": "43",
//   ":w": "45",
//   ":c": "101",
//   ":h": "103",
//   ":t": "104",
//   ":q": "112"
// },
// smileyReg = /[:;#@]{1,2}[\)\/\(\&\$\>\|xXbBcCdDpPoOhHsStTqQwW*?]{1,2}/g;

// function smileyBtnClick(smMap) {
// var smileyGrid = $(".chat-smiley-grid");
// smileyGrid.children().remove();
// for (var i in smMap) {
//   smileyGrid.append(
//     '<img class="smiley-hint" src="/chat/img/smileys/' + smMap[i] + '.gif">'
//   );
// }
// }

// $(".chatLoginClose").click(function() {
//   $(".chat-login").fadeOut(300);
// });

// $(".chat-hide").on("click", function() {
//   // $(".chat").slideToggle(300, "swing");
//   //  $(".chat-message-counter").fadeToggle(300, "swing");
// });

// $(".chat-close").on("click", function(e) {
//   //  e.preventDefault();
//   //  $(".ping-chat").fadeOut(300);
//   //socket.disconnect();
// });

// $(".smiley-btn").on("click", function(e) {
//   smileyBtnClick(smiliesMap);
// });

// $(".smiley-hint").on("click", function(e) {
//   alert("sdfsdf");
// });

// // События на клавиатуре
// $window.keydown(function(event) {
//   // Автоматическая фокусировка текущего ввода при вводе ключа
//   if (!(event.ctrlKey || event.metaKey || event.altKey)) {
//     $currentInput.focus();
//   }
//   // Когда клиент нажимает ENTER на своей клавиатуре
//   if (event.which === 13) {
//     if (username) {
//       sendMessage();
//       socket.emit("stop typing");
//       typing = false;
//     } else {
//       setUsername();
//     }
//   }
// });

//var $window = $(window);
// Запросить установку имени пользователя

// // Устанавливает имя пользователя клиента
// var setUsername = function() {
//   username = cleanInput($usernameInput.val().trim());

//   // Если имя пользователя действительно
//   if (username) {
//     var socket = io();
//  //   $(".chat-login").hide();
//  //   $(".art-chat-room").show();
//  //   $(".art-chat-input-login").off("click");
//     $currentInput = $inputMessage.focus();
//     // Сообщать серверу имя пользователя
//     socket.emit("add user", username);
//   }
// };

// // События на клавиатуре
// $window.keydown(function(event) {
//   // Автоматическая фокусировка текущего ввода при вводе ключа
//   if (!(event.ctrlKey || event.metaKey || event.altKey)) {
//     $currentInput.focus();
//   }
//   // Когда клиент нажимает ENTER на своей клавиатуре
//   if (event.which === 13) {
//     if (username) {
//       sendMessage();
//       socket.emit("stop typing");
//       typing = false;
//     } else {
//       setUsername();
//     }
//   }
// });
