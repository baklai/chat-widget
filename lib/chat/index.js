exports.create = function(io, callback) {
  var chatUsers = 0;
  io.of("/chat").on("connection", function(socket) {
    var addChatUser = false;
    // когда клиент выдает «новое сообщение», это слушает и выполняет
    socket.on("new message", function(data) {
      // мы говорим клиенту выполнить «новое сообщение»
      socket.broadcast.emit("new message", {
        username: socket.username,
        message: data
      });
    });
    // когда клиент испускает «добавить пользователя», это слушает и выполняет
    socket.on("add user", function(username) {
      if (addChatUser) return;
      // мы сохраняем имя пользователя в сеансе сокета для этого клиента
      socket.username = username;
      ++chatUsers;
      addChatUser = true;
      socket.emit("login", {
        chatUsers: chatUsers
      });
      // эхо глобально (все клиенты), с которым человек подключился
      socket.broadcast.emit("user signin", {
        username: socket.username,
        chatUsers: chatUsers
      });
    });
    // когда клиент испускает «ввод», мы передаем его другим
    socket.on("typing", function() {
      socket.broadcast.emit("typing", {
        username: socket.username
      });
    });
    // когда клиент выдает «прекратить печатать», мы передаем его другим
    socket.on("stop typing", function() {
      socket.broadcast.emit("stop typing", {
        username: socket.username
      });
    });
    // когда пользователь отключается
    socket.on("disconnect", function() {
      if (addChatUser) {
        --chatUsers;
        // эхо глобально, что этот клиент оставил
        socket.broadcast.emit("user signout", {
          username: socket.username,
          chatUsers: chatUsers
        });
      }
    });
  });

  if (typeof callback === "function") {
    callback();
  }
};
