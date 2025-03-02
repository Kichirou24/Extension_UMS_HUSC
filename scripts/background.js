async function extractUnreadMessages() {
    let formData = new URLSearchParams();
    formData.append("page", "1");
    formData.append("search", "");

    try {
        let response = await fetch("https://student.husc.edu.vn/message/inbox", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: formData
        });

        let text = await response.text();
        let parser = new DOMParser();
        let doc = parser.parseFromString(text, "text/html");

        let messages = doc.querySelectorAll('tr[style*="font-weight:bold"]');
        let unreadMessages = [];

        messages.forEach(msg => {
            let sender = msg.querySelector("td:nth-child(2)")?.textContent.trim();
            let title = msg.querySelector("td:nth-child(3) a")?.textContent.trim();
            let link = "https://student.husc.edu.vn" + msg.querySelector("td:nth-child(3) a")?.getAttribute("href");
            unreadMessages.push({ sender, title, link });
        });

        chrome.storage.sync.get("lastMessages", (data) => {
            let oldMessages = data.lastMessages || [];
            let oldTitles = oldMessages.map(msg => msg.title);
            let newNotifs = unreadMessages.filter(msg => !oldTitles.includes(msg.title));

            if (newNotifs.length > 0) {
                newNotifs.forEach(msg => {
                    showNotification(msg.sender, msg.title, msg.link);
                });

                chrome.storage.sync.set({ lastMessages: unreadMessages });
            }
        });

        chrome.action.setBadgeText({ text: unreadMessages.length > 0 ? unreadMessages.length.toString() : "" });
        chrome.action.setBadgeBackgroundColor({ color: "#FF0000" });

    } catch (error) {
        console.error("Lỗi khi lấy tin nhắn:", error);
    }
}

function showNotification(sender, title, link) {
    chrome.notifications.create(title, {
        type: "basic",
        iconUrl: "icons/icon16.png",
        title: sender,
        message: title,
        priority: 2
    });

    chrome.storage.sync.get("lastMessages", (data) => {
        let messages = data.lastMessages || [];
        if (!messages.some(m => m.title === title)) {
            messages.push({ sender, title, link });
            chrome.storage.sync.set({ lastMessages: messages });
        }
    });
}

chrome.notifications.onClicked.addListener((notificationId) => {
    chrome.storage.sync.get("lastMessages", (data) => {
        let messages = data.lastMessages || [];
        let msg = messages.find(m => m.title === notificationId);
        if (msg) chrome.tabs.create({ url: msg.link });
    });
});

setInterval(extractUnreadMessages, 1000);