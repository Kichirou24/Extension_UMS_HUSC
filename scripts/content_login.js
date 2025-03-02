(async () => {
    let data = await chrome.storage.sync.get(["username", "password"]);
    let username = data.username;
    let password = data.password;

    if (!username || !password) return;

    let userField = document.querySelector('input[name="loginID"]');
    let passField = document.querySelector('input[name="password"]');
    let loginButton = document.querySelector('button[type="submit"]');

    if (userField && passField && loginButton) {
        userField.value = username;
        passField.value = password;
        setTimeout(() => loginButton.click(), 1000);
    }
})();
