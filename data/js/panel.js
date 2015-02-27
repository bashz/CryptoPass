var container = document.getElementById("notification-list");
self.port.on("buildNotification", function (notification, instance) {
    var ul = document.createElement("ul");
    var link = document.createElement("li");
    var description = document.createElement("li");
    link.innerHTML = '#' + notification.id + ' <a target="_blanc" href="' + instance + '/Ticket/Display.html?id=' + notification.id + '"> ' + notification.title;
    description.innerHTML = notification.description;
    ul.appendChild(link);
    ul.appendChild(description);
    container.insertBefore(ul, container.firstChild);
});