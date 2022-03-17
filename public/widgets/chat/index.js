(function() {
  var css = ["/widgets/chat/css/chat.css"],
    i = 0,
    link = document.createElement("link"),
    head = document.getElementsByTagName("head")[0],
    tmp;
  link.rel = "stylesheet";
  for (; i < css.length; i++) {
    tmp = link.cloneNode(true);
    tmp.href = css[i];
    head.appendChild(tmp);
  }
})();

(function() {
  var js = ["/widgets/chat/js/chat.js", "/socket.io/socket.io.js"],
    script = document.createElement("script"),
    head = document.getElementsByTagName("head")[0],
    tmp;
  for (var i = 0; i < js.length; i++) {
    tmp = script.cloneNode(true);
    tmp.src = js[i];
    head.appendChild(tmp);
  }
})();

function chat_widget(left, top, title) {
  /* Виджет для чата */
  // Создаем виджет
  var chat_widget_btn = document.createElement("div");
  chat_widget_btn.className = "art-chat-widget";
  // Позиционируем кнопку
  chat_widget_btn.style.left = left + "%";
  chat_widget_btn.style.top = top + "%";

  chat_widget_btn.style.display = "none";
  var chat_widget_div = document.createElement("div");
  chat_widget_div.className = "art-chat-widget-img";
  var chat_widget_img = document.createElement("img");
  chat_widget_img.src = "/widgets/chat/img/chat-widget.png";
  chat_widget_div.append(chat_widget_img);
  chat_widget_btn.append(chat_widget_div);
  // Добавляем кнопку виджета в body
  document.body.append(chat_widget_btn);
  document.body.insertAdjacentHTML("beforeEnd", chat_room(title));
  var timerId = setTimeout(function request() {
    chat_widget_btn.style.display = "block";
    clearTimeout(timerId);
  }, 3000);
  // Перетаскивание чата за заголовок
  document
    .getElementsByClassName("box-header")[0]
    .addEventListener("mousedown", function(e) {
      var chatRoom = document.getElementsByClassName("art-chat-room")[0];
      var coords = getCoords(chatRoom);
      var shiftX = e.pageX - coords.left;
      var shiftY = e.pageY - coords.top;
      chatRoom.style.position = "absolute";
      document.body.appendChild(chatRoom);
      moveAt(e);
      chatRoom.style.zIndex = 1000; // над другими элементами
      function moveAt(e) {
        chatRoom.style.left = e.pageX - shiftX + "px";
        chatRoom.style.top = e.pageY - shiftY + "px";
      }
      document.onmousemove = function(e) {
        moveAt(e);
      };
      chatRoom.onmouseup = function(e) {
        document.onmousemove = null;
        chatRoom.onmouseup = null;
      };

      chatRoom.ondragstart = function() {
        return false;
      };
      function getCoords(elem) {
        // кроме IE8-
        var box = elem.getBoundingClientRect();
        return {
          top: box.top + pageYOffset,
          left: box.left + pageXOffset
        };
      }
    });
}

function chat_room(title) {
  /* Форма чата */
  return (
    '<div class="art-chat-room" style="display: none;">' +
    '<div class="box box-primary art-chat art-chat-primary">' +
    '<div class="box-header with-border">' +
    '<h3 class="box-title" onmousedown="return false" onselectstart="return false"><i class="fa fa-comments"></i> ' +
    title +
    " </h3>" +
    '<div class="box-tools pull-right">' +
    '<button type="button" title="Свернуть окно чата" class="btn btn-box-tool btn-chat-hide" >' +
    '<i class="fa fa-minus"></i>' +
    "</button>" +
    '<button type="button" class="btn btn-box-tool btn-chat-exit" title="Выйти из чата" data-widget="remove">' +
    '<i class="fa fa-times"></i>' +
    "</button>" +
    "</div>" +
    "</div>" +
    '<div class="box-body"></div>' +
    '<div class="box-footer" disabled>' +
    '<p class="art-chat-typing"></p>' +
    '<div class="input-group">' +
    '<input class="art-chat-input-messages form-control" type="text" name="message" placeholder="Напишите сообщение..."/>' +
    "</div>" +
    '<div class="box-tools">' +
    '<button type="button" class="btn btn-box-tool btn-chat-send" title="Отправить сообщение">' +
    '<i class="fa fa-share"></i>' +
    "</button>" +
    '<button type="button" class="btn btn-box-tool" title="Вставить самайлик">' +
    '<i class="fa fa-smile-o"></i>' +
    "</button>" +
    '<button type="button" class="btn btn-box-tool" title="Добавить картинку">' +
    '<i class="fa fa-picture-o"></i>' +
    "</button>" +
    '<button type="button" class="btn btn-box-tool" title="Список пользователей">' +
    '<i class="fa fa-users"></i>' +
    "</button>" +
    '<button type="button" class="btn btn-box-tool" title="Настройки">' +
    '<i class="fa fa-cogs"></i>' +
    "</button>" +
    "</div>" +
    "</div>" +
    "</div>" +
    "</div>"
  );
}
