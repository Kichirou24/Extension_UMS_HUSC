document.addEventListener("DOMContentLoaded", async () => {
    let usernameDisplay = document.getElementById("username-display");
    let loginForm = document.getElementById("login-form");
    let status = document.getElementById("status");
    let mailList = document.getElementById("mail-list");
    let logoutDropdown = document.getElementById("logout-dropdown");

    let data = await chrome.storage.sync.get(["username", "password"]);

    function updateUI(username) {
        let mailTitle = document.getElementById("mail-title");

        if (username) {
            usernameDisplay.textContent = username;
            usernameDisplay.classList.add("logged-in");
            mailTitle.style.display = "block";
            mailList.style.display = "block";
        } else {
            usernameDisplay.textContent = "Login";
            usernameDisplay.classList.remove("logged-in");
            mailTitle.style.display = "none";
            mailList.style.display = "none";
        }
    }

    updateUI(data.username);

    usernameDisplay.addEventListener("click", () => {
        if (!data.username) {
            loginForm.classList.toggle("hidden");
        }
    });

    usernameDisplay.addEventListener("mouseenter", () => {
        if (data.username) {
            logoutDropdown.classList.remove("hidden");
        }
    });

    let isHoveringDropdown = false;

    logoutDropdown.addEventListener("mouseenter", () => {
        isHoveringDropdown = true;
    });

    logoutDropdown.addEventListener("mouseleave", () => {
        isHoveringDropdown = false;
        setTimeout(() => {
            if (!isHoveringDropdown) {
                logoutDropdown.classList.add("hidden");
            }
        }, 200);
    });

    usernameDisplay.addEventListener("mouseleave", () => {
        setTimeout(() => {
            if (!isHoveringDropdown) {
                logoutDropdown.classList.add("hidden");
            }
        }, 200);
    });

    logoutDropdown.addEventListener("click", async () => {
        await chrome.storage.sync.remove(["username", "password"]);
        data = {};
        updateUI(null);
        logoutDropdown.classList.add("hidden");
    });

    document.getElementById("login-form").addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            document.getElementById("save").click();
        }
    });

    document.getElementById("save").addEventListener("click", async () => {
        let username = document.getElementById("username").value;
        let password = document.getElementById("password").value;

        if (username && password) {
            await chrome.storage.sync.set({ username, password });
            data = { username, password };
            updateUI(username);
            loginForm.classList.add("hidden");
            status.textContent = "Đăng nhập thành công!";
            status.className = "success";
            status.style.display = "block";
        } else {
            status.textContent = "Vui lòng nhập tài khoản và mật khẩu!";
            status.className = "error";
            status.style.display = "block";
        }

        setTimeout(() => { status.style.opacity = "0"; }, 2000);
    });

    await fetchUnreadMessages();
});

async function checkAccount() {
    const data = await chrome.storage.sync.get(["username", "password"]);
    const username = data.username;
    const password = data.password;

    let response = await fetch("https://student.husc.edu.vn/Account/Login", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
            username: username,
            password: password
        })
    });
}

async function fetchUnreadMessages() {
    let mailList = document.getElementById("mail-list");
    let h3Title = document.querySelector("h3");
    mailList.innerHTML = "Đang tải...";
    h3Title.style.display = "none";
    mailList.style.display = "none";

    let data = await chrome.storage.sync.get(["username", "password"]);

    if (!data.username || !data.password) {
        return;
    }

    try {
        let page = 1;
        let hasMoreMessages = true;
        mailList.innerHTML = "";
        h3Title.style.display = "block";
        mailList.style.display = "block";

        while (hasMoreMessages) {
            let formData = new URLSearchParams();
            formData.append("page", page.toString());
            formData.append("search", "");

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

            messages.forEach(msg => {
                let sender = msg.querySelector("td:nth-child(2)")?.textContent.trim();
                let title = msg.querySelector("td:nth-child(3) a")?.textContent.trim();
                let link = "https://student.husc.edu.vn" + msg.querySelector("td:nth-child(3) a")?.href.match(/\/Message\/.*/);
                let time = msg.querySelector("td:nth-child(4)")?.textContent.trim();

                let li = document.createElement("li");
                li.innerHTML = `<a href="${link}" target="_blank">${title} - ${sender} (${time})</a>`;
                mailList.appendChild(li);
            });

            if (messages.length === 0) {
                hasMoreMessages = false;
            } else {
                page++;
            }
        }

        if (mailList.innerHTML === "") {
            mailList.innerHTML = "<li>Không có mail chưa đọc</li>";
        }
    } catch (error) {
        mailList.innerHTML = "<li>Lỗi khi lấy dữ liệu</li>";
    }
}