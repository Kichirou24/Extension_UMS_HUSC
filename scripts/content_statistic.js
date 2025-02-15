(async () => {
    const utils = await import(chrome.runtime.getURL("scripts/utils.js"));

    function handleButtonClick(courseId) {
        let overlay = document.createElement("div");
        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
        overlay.style.display = "flex";
        overlay.style.justifyContent = "center";
        overlay.style.alignItems = "center";
        overlay.style.zIndex = "9999";
        overlay.style.opacity = "0";
        overlay.style.transition = "opacity 0.3s ease-in-out";

        let content = document.createElement("div");
        content.style.backgroundColor = "white";
        content.style.padding = "30px";
        content.style.borderRadius = "15px";
        content.style.boxShadow = "0px 0px 15px rgba(0, 0, 0, 0.3)";
        content.style.width = "90%";
        content.style.height = "60%";
        content.style.maxWidth = "1000px";
        content.style.maxHeight = "100vh";
        content.style.overflowY = "auto";
        content.style.position = "relative";
        content.style.opacity = "0";
        content.style.transform = "translateY(-20px)";
        content.style.transition = "opacity 0.3s ease-in-out, transform 0.3s ease-in-out";

        let closeButton = document.createElement("span");
        closeButton.innerHTML = "&times;";
        closeButton.style.position = "absolute";
        closeButton.style.top = "10px";
        closeButton.style.right = "15px";
        closeButton.style.fontSize = "24px";
        closeButton.style.cursor = "pointer";
        closeButton.style.color = "#ff4d4d";
        closeButton.style.fontWeight = "bold";

        closeButton.onmouseover = () => {
            closeButton.style.color = "red";
        };
        closeButton.onmouseout = () => {
            closeButton.style.color = "#ff4d4d";
        };

        function closeOverlay() {
            overlay.style.opacity = "0";
            content.style.opacity = "0";
            content.style.transform = "translateY(-20px)";
            setTimeout(() => overlay.remove(), 300);
        }

        closeButton.onclick = closeOverlay;
        overlay.onclick = (e) => {
            if (e.target === overlay) closeOverlay();
        };

        content.appendChild(closeButton);
        overlay.appendChild(content);
        document.body.appendChild(overlay);

        setTimeout(() => {
            overlay.style.opacity = "1";
            content.style.opacity = "1";
            content.style.transform = "translateY(0)";
        }, 10);
    }

    const style = document.createElement("style");
    style.innerHTML = `
        .btn-export {
            width: 50px; 
            height: 50px;
            padding: 10px;
            display: flex;
            justify-content: center;
            align-items: center;
            transition: width 0.3s ease-in-out, padding 0.3s ease-in-out;
            white-space: nowrap; 
        }

        .btn-export:hover {
            width: 180px; 
            padding: 10px 15px;
        }

        .btn-export span {
            display: none; 
        }

        .btn-export:hover span {
            display: inline; 
        }

        .btn-export:hover svg {
            display: none;    
        }
    `;

    function addButtonStatistic() {
        document.head.appendChild(style);

        const button = document.createElement("button");
        button.classList.add("btn-export");

        button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-graph-up" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M0 0h1v15h15v1H0zm14.817 3.113a.5.5 0 0 1 .07.704l-4.5 5.5a.5.5 0 0 1-.74.037L7.06 6.767l-3.656 5.027a.5.5 0 0 1-.808-.588l4-5.5a.5.5 0 0 1 .758-.06l2.609 2.61 4.15-5.073a.5.5 0 0 1 .704-.07"/>
        </svg>
        <span>Statistics</span>
    `;

        button.style.position = "fixed";
        button.style.top = "50%";
        button.style.right = "0px";
        button.style.transform = "translateY(-50%)";
        button.style.overflow = "hidden";
        button.style.background = "#007bff";
        button.style.color = "white";
        button.style.border = "none";
        button.style.borderRadius = "5px 0 0 5px";
        button.style.cursor = "pointer";
        button.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
        button.style.zIndex = "9999";
        button.style.fontSize = "16px";

        button.style.display = "flex";
        button.style.alignItems = "center";
        button.style.justifyContent = "center";

        document.body.appendChild(button);

        button.addEventListener("click", handleButtonClick);
    }

    addButtonStatistic();
})();
