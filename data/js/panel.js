var container = document.getElementById("notification-list");
self.port.on("buildNotification", function (notification, instance) {
    if(err = document.getElementById("err")){
        container.removeChild(err);
    }
    var ul = document.createElement("ul");
    var li = document.createElement("li");
    li.textContent = '#' + notification.id + ' ';
    var link = document.createElement("a");
    link.textContent = notification.title;
    link.setAttribute('href', instance + '/Ticket/Display.html?id=' + notification.id);
    link.setAttribute('target', '_blanc');
    var description = document.createElement("li");
    description.textContent = notification.description;
    li.appendChild(link);
    ul.appendChild(li);
    ul.appendChild(description);
    container.insertBefore(ul, container.firstChild);
    document.getElementById("audio").play();
});
self.port.on("error", function (text, linkText, href){
    if(err = document.getElementById("err")){
        container.removeChild(err);
    }
    var span = document.createElement("span");
    span.textContent = text;
    span.setAttribute('id', 'err');
    var link = document.createElement("a");
    link.textContent = linkText;
    link.setAttribute('href', href);
    link.setAttribute('target', '_blanc');
    span.appendChild(link);
    container.appendChild(span);
});