(async () => {
    const utils = await import(chrome.runtime.getURL("scripts/utils.js"));

    async function handleButtonClick(courseId, scoreExam) {
        let res = await utils.getInfoCourse(courseId, scoreExam);

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
        content.style.height = "65%";
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

        content.innerHTML = `
            <h2 style="text-align: center;">Chi tiết học phần</h2>
            <div>${res.infoGeneral || "Không có dữ liệu"}</div>
            <div>${res.scoringMethod || "Không có dữ liệu"}</div>
            <div>${res.evaluationResults || "Không có dữ liệu"}</div>
        `;

        let scoreOverlay = document.createElement("div");
        scoreOverlay.style.backgroundColor = "rgba(227, 215, 132, 0.48)";
        scoreOverlay.style.padding = "15px";
        scoreOverlay.style.borderRadius = "10px";
        scoreOverlay.style.marginTop = "20px";
        scoreOverlay.style.textAlign = "center";
        scoreOverlay.style.fontSize = "16px";
        scoreOverlay.style.fontWeight = "bold";
        scoreOverlay.style.display = "flex";
        scoreOverlay.style.justifyContent = "center";
        scoreOverlay.style.alignItems = "center";
        scoreOverlay.style.gap = "15px";

        scoreOverlay.innerHTML = `
        <span>Điểm thi tối thiểu để có thể đạt:</span>
        <span style="color: #28a745;">A: ${res.scorePass.A}</span>
        <span> / </span>
        <span style="color: #007bff;">B: ${res.scorePass.B}</span>
        <span> / </span>
        <span style="color: #ffc107;">C: ${res.scorePass.C}</span>
        <span> / </span>
        <span style="color: #dc3545;">D: ${res.scorePass.D}</span>
        `;

        content.appendChild(closeButton);

        if (res.scorePass !== 404)
            content.appendChild(scoreOverlay);
        overlay.appendChild(content);
        document.body.appendChild(overlay);

        setTimeout(() => {
            overlay.style.opacity = "1";
            content.style.opacity = "1";
            content.style.transform = "translateY(0)";
        }, 10);
    }

    function addButtonHat() {
        document.querySelectorAll('td a[href^="/Course/Details/"]').forEach(link => {
            if (!link.parentNode.querySelector(".hat-button")) {
                let button = document.createElement("button");
                button.className = "hat-button";

                button.style.marginLeft = "8px";
                button.style.padding = "4px";
                button.style.backgroundColor = "#007bff";
                button.style.color = "white";
                button.style.border = "none";
                button.style.borderRadius = "4px";
                button.style.cursor = "pointer";
                button.style.fontSize = "12px";

                button.innerHTML = "🎓";

                button.onclick = () => {
                    let row = button.closest("tr");
                    let cells = row.querySelectorAll("td.text-center");
                    let courseId = link.href;
                    let scoreExam = cells[5]?.textContent.trim() || 0;

                    handleButtonClick(courseId, scoreExam);
                };

                link.parentNode.appendChild(button);
            }
        });
    }


    addButtonHat();
})();