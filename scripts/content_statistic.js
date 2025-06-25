(async () => {
    const utils = await import(chrome.runtime.getURL("scripts/utils.js"));
    // Load Chart.js
    const chartJsScript = document.createElement('script');
    chartJsScript.src = await chrome.runtime.getURL('scripts/libs/Chart.min.js');
    document.head.appendChild(chartJsScript);

    chartJsScript.onload = async () => {
        // --- Overlay UI ---
        function showOverlay(content) {
            const overlay = document.createElement("div");
            Object.assign(overlay.style, {
                position: "fixed", top: 0, left: 0, width: "100%", height: "108%",
                backgroundColor: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center",
                alignItems: "center", zIndex: 9999, opacity: 0, transition: "opacity 0.3s"
            });
            overlay.id = "overlay";
            overlay.appendChild(content);
            document.body.appendChild(overlay);
            setTimeout(() => {
                overlay.style.opacity = 1;
                content.style.opacity = 1;
                content.style.transform = "translateY(0)";
            }, 10);
            return overlay;
        }

        // --- Content UI ---
        function createContent() {
            const content = document.createElement("div");
            Object.assign(content.style, {
                backgroundColor: "#fff", padding: "30px", borderRadius: "15px",
                boxShadow: "0 0 15px rgba(0,0,0,0.3)", width: "1200px", height: "700px",
                maxWidth: "100%", maxHeight: "85%", overflowY: "auto", position: "relative",
                opacity: 0, transform: "translateY(-20px)",
                transition: "opacity 0.3s, transform 0.3s", display: "flex", flexDirection: "column"
            });
            content.id = "content";
            return content;
        }

        // --- Tab UI ---
        function createTabs(panelContainer, panels, semestersGPA, yearsGPA) {
            const tabs = document.createElement("div");
            Object.assign(tabs.style, {
                display: "flex", justifyContent: "space-around", marginBottom: "10px", borderBottom: "2px solid #ddd"
            });
            const tabNames = ["Tổng quan", "Điểm theo học kỳ", "Điểm theo năm"];
            let currentIndex = 0;
            const tabButtons = tabNames.map((name, idx) => {
                const tab = document.createElement("button");
                tab.className = "tab-button";
                tab.innerText = name;
                Object.assign(tab.style, {
                    padding: "10px 15px", border: "none",
                    backgroundColor: idx === 0 ? "#007bff" : "transparent",
                    color: idx === 0 ? "white" : "#333",
                    cursor: "pointer", flex: "1", fontWeight: "bold", borderRadius: "5px 5px 0 0"
                });
                tab.onclick = () => {
                    if (currentIndex !== idx) {
                        tabButtons.forEach((btn, i) => {
                            btn.style.backgroundColor = i === idx ? "#007bff" : "transparent";
                            btn.style.color = i === idx ? "white" : "#333";
                        });
                        panelContainer.innerHTML = "";
                        panelContainer.appendChild(panels[idx]);
                        if (idx === 1) createSemestersChart(semestersGPA);
                        if (idx === 2) createYearsChart(yearsGPA);
                        currentIndex = idx;
                    }
                };
                tabs.appendChild(tab);
                return tab;
            });
            return tabs;
        }

        // --- Panel Container ---
        function createPanelContainer() {
            const panelContainer = document.createElement("div");
            Object.assign(panelContainer.style, {
                flex: "1", overflowY: "auto", display: "flex", flexDirection: "column"
            });
            panelContainer.id = "panel-container";
            return panelContainer;
        }

        // --- Panels ---
        async function createPanels(res) {
            // Tổng quan
            const overviewPanel = document.createElement("div");
            overviewPanel.className = "panel-container";
            overviewPanel.style.width = "100%";
            overviewPanel.appendChild(createHeader("Tổng quan sinh viên"));
            overviewPanel.appendChild(await createOverviewPanel(res));
            // Học kỳ
            const semesterPanel = document.createElement("div");
            semesterPanel.className = "panel";
            semesterPanel.style.textAlign = "center";
            semesterPanel.style.marginBottom = "20px";
            semesterPanel.innerHTML = `<h3 style="color: #007bff;">Biểu đồ điểm theo học kỳ</h3>`;
            semesterPanel.appendChild(createChartCanvas("semestersChart"));
            // Năm
            const yearPanel = document.createElement("div");
            yearPanel.className = "panel";
            yearPanel.style.textAlign = "center";
            yearPanel.style.marginBottom = "20px";
            yearPanel.innerHTML = `<h3 style="color: #007bff;">Biểu đồ điểm theo năm</h3>`;
            yearPanel.appendChild(createChartCanvas("yearsChart"));
            return [overviewPanel, semesterPanel, yearPanel];
        }

        function createHeader(title) {
            const header = document.createElement("div");
            header.className = "panel-header";
            header.style.textAlign = "center";
            header.style.marginBottom = "20px";
            header.innerHTML = `<h3 style="color: #007bff;">${title}</h3>`;
            return header;
        }

        async function createOverviewPanel(res) {
            const overviewPanel = document.createElement("div");
            Object.assign(overviewPanel.style, {
                display: "flex", flexDirection: "row", gap: "20px", alignItems: "stretch"
            });
            overviewPanel.appendChild(createLeftPanel(res));
            overviewPanel.appendChild(createRightPanel());
            return overviewPanel;
        }

        function createLeftPanel(res) {
            const leftPanel = document.createElement("div");
            Object.assign(leftPanel.style, {
                width: "50%", padding: "20px", backgroundColor: "#fff", borderRadius: "12px",
                boxShadow: "0px 4px 10px rgba(0,0,0,0.1)", border: "1px solid #ddd"
            });
            leftPanel.innerHTML = `
                <h4 style="margin-bottom: 15px; text-align: center; color: #007bff;">Thông tin sinh viên</h4>
                <table style="width: 100%; border-collapse: collapse; font-size: 16px;">
                    <tr><td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #333;">Họ và tên</td><td style="padding: 10px; border-bottom: 1px solid #eee; color: #555;">${res.fullname || "N/A"}</td></tr>
                    <tr><td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #333;">Khóa học</td><td style="padding: 10px; border-bottom: 1px solid #eee; color: #555;">${res.admissionCourse || "N/A"}</td></tr>
                    <tr><td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #333;">Ngành học</td><td style="padding: 10px; border-bottom: 1px solid #eee; color: #555;">${res.fieldOfStudy || "N/A"}</td></tr>
                    <tr><td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #333;">Tổng tín chỉ</td><td style="padding: 10px; border-bottom: 1px solid #eee; color: #555;">${res.totalCredits || "N/A"}</td></tr>
                    <tr><td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #333;">ĐTB hệ 4:</td><td style="padding: 10px; border-bottom: 1px solid #eee; color: #555;">${res.GPA4 || "N/A"}</td></tr>
                    <tr><td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #333;">ĐTB hệ 10:</td><td style="padding: 10px; border-bottom: 1px solid #eee; color: #555;">${res.GPA10 || "N/A"}</td></tr>
                    <tr><td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #333;">Học lực:</td><td style="padding: 10px; border-bottom: 1px solid #eee; color: #555;">${res.academicPerformance || "N/A"}</td></tr>
                    <tr>
                        <td colspan="2" style="padding: 10px; font-weight: bold; text-align: center; color: #333;">Bảng điểm</td>
                    </tr>
                    <tr>
                        <td colspan="2" style="padding: 10px; text-align: center;">
                            <span style="color: #28a745; font-weight: bold;">A: ${res.gradesCount.A ?? "N/A"}</span> |
                            <span style="color: #007bff; font-weight: bold;">B: ${res.gradesCount.B ?? "N/A"}</span> |
                            <span style="color: #ffc107; font-weight: bold;">C: ${res.gradesCount.C ?? "N/A"}</span> |
                            <span style="color: #dc3545; font-weight: bold;">D: ${res.gradesCount.D ?? "N/A"}</span> |
                            <span style="color: #bb35dc; font-weight: bold;">F: ${res.gradesCount.F ?? "N/A"}</span>
                        </td>
                    </tr>
                </table>
            `;
            return leftPanel;
        }

        function createRightPanel() {
            const rightPanel = document.createElement("div");
            Object.assign(rightPanel.style, {
                width: "50%", padding: "20px", display: "flex", justifyContent: "center",
                alignItems: "center", backgroundColor: "#f8f9fa", borderRadius: "12px",
                boxShadow: "0px 4px 10px rgba(0,0,0,0.1)"
            });
            rightPanel.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center;">
                    <h4 style="margin-bottom: 15px; text-align: center; color: #007bff;">Biểu đồ thống kê</h4>
                    <canvas id="gradesChart" width="350" height="300"></canvas>
                </div>
            `;
            return rightPanel;
        }

        function createChartCanvas(id) {
            const canvas = document.createElement("canvas");
            canvas.id = id;
            canvas.style.width = "1100px";
            canvas.style.height = "450px";
            return canvas;
        }

        // --- Chart Drawing ---
        function createPieChart(gradesCount) {
            const ctx = document.getElementById('gradesChart').getContext('2d');
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['A', 'B', 'C', 'D', 'F'],
                    datasets: [{
                        data: ['A', 'B', 'C', 'D', 'F'].map(k => gradesCount[k] || 0),
                        backgroundColor: ['#28a745', '#007bff', '#ffc107', '#dc3545', '#bb35dc'],
                        borderColor: '#fff', borderWidth: 3
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: { font: { size: 14, weight: 'bold' }, color: '#333' }
                        }
                    }
                }
            });
        }
        function createSemestersChart(semestersGPA) {
            const filtered = semestersGPA.filter(s => s.GPA10Semester !== 0);
            const ctx = document.getElementById('semestersChart').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: filtered.map(s => s.semester),
                    datasets: [{
                        label: 'ĐTB hệ 10',
                        data: filtered.map(s => s.GPA10Semester),
                        borderColor: '#007bff',
                        backgroundColor: 'rgba(0, 123, 255, 0.2)',
                        fill: false, tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: { font: { size: 14, weight: 'bold' }, color: '#333' }
                        }
                    },
                    scales: {
                        x: { title: { display: true, text: 'Semester' } },
                        y: { title: { display: true, text: 'GPA10' }, beginAtZero: true, max: 4 }
                    }
                }
            });
        }
        function createYearsChart(yearsGPA) {
            const filtered = yearsGPA.filter(y => y.GPA10Year !== 0);
            const ctx = document.getElementById('yearsChart').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: filtered.map(y => y.year),
                    datasets: [{
                        label: 'ĐTB hệ 10',
                        data: filtered.map(y => y.GPA10Year),
                        borderColor: '#007bff',
                        backgroundColor: 'rgba(0, 123, 255, 0.2)',
                        fill: false, tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: { font: { size: 14, weight: 'bold' }, color: '#333' }
                        }
                    },
                    scales: {
                        x: { title: { display: true, text: 'Year' } },
                        y: { title: { display: true, text: 'GPA10' }, beginAtZero: true, max: 4 }
                    }
                }
            });
        }

        // --- Close Button ---
        function createCloseButton(overlay, content) {
            const closeButton = document.createElement("span");
            closeButton.innerHTML = "&times;";
            Object.assign(closeButton.style, {
                position: "absolute", top: "10px", right: "15px", fontSize: "24px",
                cursor: "pointer", color: "#ff4d4d", fontWeight: "bold"
            });
            closeButton.onclick = () => {
                overlay.style.opacity = 0;
                content.style.opacity = 0;
                content.style.transform = "translateY(-20px)";
                setTimeout(() => overlay.remove(), 300);
            };
            overlay.onclick = (e) => { if (e.target === overlay) closeButton.onclick(); };
            return closeButton;
        }

        // --- Main Handler ---
        async function handleButtonClick() {
            const res = await utils.getInfo();
            const [semestersGPA, yearsGPA] = await Promise.all([
                utils.caclSemestersGPA(),
                utils.caclYearsGPA()
            ]);
            const content = createContent();
            const panelContainer = createPanelContainer();
            const panels = await createPanels(res);
            const tabs = createTabs(panelContainer, panels, semestersGPA, yearsGPA);
            panelContainer.appendChild(panels[0]);
            content.appendChild(createCloseButton(showOverlay(content), content));
            content.appendChild(tabs);
            content.appendChild(panelContainer);
            createPieChart(res.gradesCount);
        }

        // --- Style & Button ---
        if (!document.querySelector("style[data-statistic-btn]")) {
            const style = document.createElement("style");
            style.setAttribute("data-statistic-btn", "1");
            style.innerHTML = `
                .btn-statistic {
                    width: 50px; height: 50px; padding: 10px;
                    display: flex; justify-content: center; align-items: center;
                    transition: width 0.3s, padding 0.3s; white-space: nowrap;
                }
                .btn-statistic:hover { width: 180px; padding: 10px 15px; }
                .btn-statistic span { display: none; }
                .btn-statistic:hover span { display: inline; }
                .btn-statistic:hover svg { display: none; }
                #overlay {
                    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                    background: rgba(0,0,0,0.8); z-index: 9999; display: flex; justify-content: center; align-items: center;
                }
                #content {
                    background: #fff; padding: 30px; border-radius: 15px;
                    box-shadow: 0 0 15px rgba(0,0,0,0.3); width: 90vw; max-width: 1200px; height: auto; max-height: 90vh;
                    overflow-y: auto; position: relative; display: flex; flex-direction: column;
                }
                .panel-container, .panel {
                    width: 100%;
                }
                .panel-header { text-align: center; margin-bottom: 20px; }
                @media (max-width: 900px) {
                    #content { width: 98vw; padding: 10px; min-width: unset; }
                    .panel-container { flex-direction: column !important; }
                }
                @media (max-width: 600px) {
                    #content { width: 100vw; max-width: 100vw; padding: 2vw; border-radius: 0; }
                    .panel-container, .panel { flex-direction: column !important; width: 100%; }
                    .panel-header { font-size: 18px; }
                    .btn-statistic { width: 40px; height: 40px; font-size: 12px; }
                }
                .left-panel, .right-panel {
                    width: 50%;
                }
                @media (max-width: 900px) {
                    .left-panel, .right-panel { width: 100% !important; padding: 10px !important; }
                }
            `;
            document.head.appendChild(style);
        }

        if (!document.querySelector(".btn-statistic")) {
            const button = document.createElement("button");
            button.classList.add("btn-statistic");
            button.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-graph-up" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M0 0h1v15h15v1H0zm14.817 3.113a.5.5 0 0 1 .07.704l-4.5 5.5a.5.5 0 0 1-.74.037L7.06 6.767l-3.656 5.027a.5.5 0 0 1-.808-.588l4-5.5a.5.5 0 0 1 .758-.06l2.609 2.61 4.15-5.073a.5.5 0 0 1 .704-.07"/>
                </svg>
                <span>Statistics</span>
            `;
            Object.assign(button.style, {
                position: "fixed", top: "50%", right: "0px", transform: "translateY(-50%)",
                overflow: "hidden", background: "#007bff", color: "white", border: "none",
                borderRadius: "5px 0 0 5px", cursor: "pointer", boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                zIndex: "9999", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center"
            });
            document.body.appendChild(button);
            button.addEventListener("click", handleButtonClick);
        }
    };
})();