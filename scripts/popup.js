document.addEventListener("DOMContentLoaded", async () => {
    let data = await chrome.storage.sync.get(["username", "password"]);
    document.getElementById("username").value = data.username || "";
    document.getElementById("password").value = data.password || "";
});

document.getElementById("save").addEventListener("click", async () => {
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;
    let status = document.getElementById("status");

    if (username && password) {
        await chrome.storage.sync.set({ username: username, password: password });

        status.style.display = "block";
        status.textContent = "Đã lưu thành công!";
        status.style.color = "green";

        setTimeout(() => { status.style.display = "none"; }, 2000);
    } else {
        status.style.display = "block";
        status.textContent = "Vui lòng nhập tài khoản và mật khẩu!";
        status.style.color = "red";

        setTimeout(() => { status.style.display = "none"; }, 2000);
    }
});
