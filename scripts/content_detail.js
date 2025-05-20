(async () => {
    const utils = await import(chrome.runtime.getURL("scripts/utils.js"));

    // --- Overlay UI ---
    function showOverlay(html, scorePass) {
        const overlay = document.createElement("div");
        Object.assign(overlay.style, {
            position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
            backgroundColor: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center",
            alignItems: "center", zIndex: 9999, opacity: 0, transition: "opacity 0.3s"
        });
        overlay.id = "overlay";

        const content = document.createElement("div");
        Object.assign(content.style, {
            backgroundColor: "#fff", padding: "30px", borderRadius: "15px",
            boxShadow: "0 0 15px rgba(0,0,0,0.3)", width: "1000px", height: "620px",
            maxWidth: "60%", maxHeight: "85%", overflowY: "auto", position: "relative",
            opacity: 0, transform: "translateY(-20px)",
            transition: "opacity 0.3s, transform 0.3s"
        });
        content.id = "content";
        content.innerHTML = html;

        // Close button
        const closeButton = document.createElement("span");
        closeButton.innerHTML = "&times;";
        Object.assign(closeButton.style, {
            position: "absolute", top: "10px", right: "15px", fontSize: "24px",
            cursor: "pointer", color: "#ff4d4d", fontWeight: "bold"
        });
        closeButton.onmouseover = () => closeButton.style.color = "red";
        closeButton.onmouseout = () => closeButton.style.color = "#ff4d4d";
        closeButton.onclick = () => close();
        overlay.onclick = e => { if (e.target === overlay) close(); };
        function close() {
            overlay.style.opacity = 0;
            content.style.opacity = 0;
            content.style.transform = "translateY(-20px)";
            setTimeout(() => overlay.remove(), 300);
        }
        content.appendChild(closeButton);

        // Score overlay
        if (scorePass && scorePass !== 404) {
            const scoreOverlay = document.createElement("div");
            Object.assign(scoreOverlay.style, {
                backgroundColor: "rgba(227,215,132,0.48)", padding: "15px", borderRadius: "10px",
                marginTop: "20px", textAlign: "center", fontSize: "16px", fontWeight: "bold",
                display: "flex", justifyContent: "center", alignItems: "center", gap: "15px"
            });
            scoreOverlay.innerHTML = `
                <span>Điểm thi tối thiểu để có thể đạt:</span>
                <span style="color: #28a745;">A: ${scorePass.A}</span>
                <span> | </span>
                <span style="color: #007bff;">B: ${scorePass.B}</span>
                <span> | </span>
                <span style="color: #ffc107;">C: ${scorePass.C}</span>
                <span> | </span>
                <span style="color: #dc3545;">D: ${scorePass.D}</span>
            `;
            content.appendChild(scoreOverlay);
        }

        overlay.appendChild(content);
        document.body.appendChild(overlay);
        setTimeout(() => {
            overlay.style.opacity = 1;
            content.style.opacity = 1;
            content.style.transform = "translateY(0)";
        }, 10);
    }

    // --- Main handler ---
    async function handleButtonClick(courseId, scoreExam) {
        const res = await utils.getInfoCourse(courseId, scoreExam);
        showOverlay(`
            <h2 style="text-align: center;">Chi tiết học phần</h2>
            <div>${res.infoGeneral || "Không có dữ liệu"}</div>
            <div>${res.scoringMethod || "Không có dữ liệu"}</div>
            <div>${res.evaluationResults || "Không có dữ liệu"}</div>
        `, res.scorePass);
    }

    // --- Add button to each course row ---
    function addButtonHat() {
        document.querySelectorAll('td a[href^="/Course/Details/"]').forEach(link => {
            if (!link.parentNode.querySelector(".hat-button")) {
                const button = document.createElement("button");
                button.className = "hat-button";
                Object.assign(button.style, {
                    marginLeft: "8px", padding: "4px", backgroundColor: "#007bff", color: "white",
                    border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px"
                });
                button.innerHTML = "🎓";
                button.onclick = () => {
                    const row = button.closest("tr");
                    const cells = row.querySelectorAll("td.text-center");
                    const courseId = link.href;
                    const scoreExam = cells[5]?.textContent.trim() || 0;
                    handleButtonClick(courseId, scoreExam);
                };
                link.parentNode.appendChild(button);
            }
        });
    }

    addButtonHat();
})();