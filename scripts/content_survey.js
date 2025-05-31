// Helper: Loading Overlay
function showLoadingOverlay() {
    if (document.querySelector("#survey-loading")) return;
    const overlay = document.createElement("div");
    overlay.id = "survey-loading";
    Object.assign(overlay.style, {
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    });
    overlay.innerHTML = `
        <div style="color:#fff;font-size:18px;display:flex;flex-direction:column;align-items:center;">
            <div class="spinner" style="
                width:50px;height:50px;
                border:5px solid #f3f3f3;
                border-top:5px solid #28a745;
                border-radius:50%;
                animation:spin 1s linear infinite;
            "></div>
            <div style="margin-top:10px;">Đang tải đánh giá...</div>
        </div>
    `;
    document.body.appendChild(overlay);

    if (!document.querySelector("style[data-loading]")) {
        const style = document.createElement("style");
        style.setAttribute("data-loading", "1");
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg);}
                100% { transform: rotate(360deg);}
            }
        `;
        document.head.appendChild(style);
    }
}

function hideLoadingOverlay() {
    document.querySelector("#survey-loading")?.remove();
}

// Helper: Toast Notification
function showToast(message, duration = 3000) {
    document.querySelector("#survey-toast")?.remove();
    const toast = document.createElement("div");
    toast.id = "survey-toast";
    toast.textContent = message;
    Object.assign(toast.style, {
        position: "fixed",
        top: "20px",
        right: "20px",
        padding: "15px 25px",
        backgroundColor: "#28a745",
        color: "#fff",
        fontSize: "16px",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        zIndex: 10001,
        opacity: 0,
        transition: "opacity 0.3s"
    });
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = 1; }, 10);
    setTimeout(() => {
        toast.style.opacity = 0;
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Helper: Survey Auto-Submit
function handleSurveyClick() {
    showLoadingOverlay();
    const surveys = Array.from(document.querySelectorAll('td.text-right a')).map(a => a.href);
    const token = document.querySelector('input[name="__RequestVerificationToken"]')?.value || '';
    const answers = {
        answer_78: 4, answer_3: 4, answer_79: 4, answer_80: 4, answer_45: 4,
        answer_9: 4, answer_10: 4, answer_11: 4, answer_47: 4, answer_14: 4,
        answer_49: 4, answer_33: 4, answer_52: 4, answer_34: 4, answer_55: 4,
        answer_51: 4, answer_20: 4, answer_21: 4, answer_54: ".", answer_56: "."
    };

    const requests = surveys.map(url => {
        const formData = new URLSearchParams();
        formData.append("__RequestVerificationToken", token);
        Object.entries(answers).forEach(([k, v]) => formData.append(k, v));
        return fetch(url, {
            method: 'POST',
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
            body: formData
        })
            .then(r => r.json())
            .then(data => {
                if (!data.success) console.error(`Failed: ${url}`, data);
            })
            .catch(e => console.error(`Error: ${url}`, e));
    });

    Promise.all(requests).then(() => {
        hideLoadingOverlay();
        showToast("Đã tự động đánh giá tất cả các khảo sát!");
    });

    setTimeout(() => {
        hideLoadingOverlay();
        showToast("Test");
    }, 2000);
}

// Button UI
(function setupSurveyButton() {
    if (!document.querySelector("style[data-survey-btn]")) {
        const style = document.createElement("style");
        style.setAttribute("data-survey-btn", "1");
        style.innerHTML = `
            .btn-survey {
                width:50px;height:50px;padding:10px;
                display:flex;justify-content:center;align-items:center;
                transition:width 0.3s,padding 0.3s;
                white-space:nowrap;
            }
            .btn-survey:hover { width:180px;padding:10px 15px;}
            .btn-survey span { display:none;}
            .btn-survey:hover span { display:inline;}
            .btn-survey:hover svg { display:none;}
        `;
        document.head.appendChild(style);
    }
    if (!document.querySelector(".btn-survey")) {
        const button = document.createElement("button");
        button.className = "btn-survey";
        button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-circle" viewBox="0 0 16 16">
                <path d="M15.854 7.646a.5.5 0 0 1 0 .708l-8 8a.5.5 0 0 1-.708 0L.146 9.354a.5.5 0 1 1 .708-.708L7.5 14.293l7.646-7.647a.5.5 0 0 1 .708 0z"/>
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
            </svg>
            <span>Tự động đánh giá</span>
        `;
        Object.assign(button.style, {
            position: "fixed",
            top: "60%",
            right: 0,
            transform: "translateY(-50%)",
            overflow: "hidden",
            background: "#28a745",
            color: "#fff",
            border: "none",
            borderRadius: "5px 0 0 5px",
            cursor: "pointer",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            zIndex: 9999,
            fontSize: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
        });
        button.addEventListener("click", handleSurveyClick);
        document.body.appendChild(button);
    }
})();
