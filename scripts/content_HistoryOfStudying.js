(async () => {
    const utils = await import(chrome.runtime.getURL("scripts/utils.js"));

    // Load Chart.js dynamically
    const chartJsScript = document.createElement('script');
    chartJsScript.src = await chrome.runtime.getURL('scripts/libs/Chart.min.js');
    document.head.appendChild(chartJsScript);

    chartJsScript.onload = async () => {
        // ======================== Statistics ========================
        // Main handler for statistics button
        async function handleButtonStatistic() {
            const res = await utils.getInfo();
            const semestersGPA = await utils.caclSemestersGPA();
            const yearsGPA = await utils.caclYearsGPA();

            const overlay = createOverlay();
            const content = createContent();
            const panelContainer = createPanelContainer();
            const panels = await createPanels(res);
            const tabs = createTabs(panelContainer, panels, semestersGPA, yearsGPA);

            panelContainer.appendChild(panels[0]);
            content.append(
                createCloseButton(overlay, content),
                tabs,
                panelContainer
            );
            overlay.appendChild(content);
            document.body.appendChild(overlay);

            setTimeout(() => {
                overlay.style.opacity = "1";
                content.style.opacity = "1";
                content.style.transform = "translateY(0)";
            }, 10);

            createPieChart(res.gradesCount);
        }

        // Overlay for modal
        function createOverlay() {
            const overlay = document.createElement("div");
            overlay.id = "overlay";
            Object.assign(overlay.style, {
                position: "fixed",
                top: "0",
                left: "0",
                width: "100%",
                height: "108%",
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: "9999",
                opacity: "0",
                transition: "opacity 0.3s ease-in-out"
            });
            return overlay;
        }

        // Modal content container
        function createContent() {
            const content = document.createElement("div");
            content.id = "content";
            Object.assign(content.style, {
                backgroundColor: "white",
                padding: "30px",
                borderRadius: "15px",
                boxShadow: "0px 0px 15px rgba(0, 0, 0, 0.3)",
                width: "1200px",
                height: "700px",
                maxWidth: "100%",
                maxHeight: "85%",
                overflowY: "auto",
                position: "relative",
                opacity: "0",
                transform: "translateY(-20px)",
                transition: "opacity 0.3s ease-in-out, transform 0.3s ease-in-out",
                display: "flex",
                flexDirection: "column"
            });
            return content;
        }

        // Tabs for switching panels
        function createTabs(panelContainer, panels, semestersGPA, yearsGPA) {
            const tabs = document.createElement("div");
            tabs.id = "tabs";
            Object.assign(tabs.style, {
                display: "flex",
                justifyContent: "space-around",
                marginBottom: "10px",
                borderBottom: "2px solid #ddd"
            });

            const tabNames = ["Tổng quan", "Điểm theo học kỳ", "Điểm theo năm"];
            const tabButtons = [];
            let currentIndex = 0;

            tabNames.forEach((name, index) => {
                const tab = document.createElement("button");
                tab.className = "tab-button";
                tab.innerText = name;
                Object.assign(tab.style, {
                    padding: "10px 15px",
                    border: "none",
                    backgroundColor: index === 0 ? "#007bff" : "transparent",
                    color: index === 0 ? "white" : "#333",
                    cursor: "pointer",
                    flex: "1",
                    fontWeight: "bold",
                    borderRadius: "5px 5px 0 0"
                });

                tab.onclick = () => {
                    if (currentIndex !== index) {
                        tabButtons.forEach((btn, i) => {
                            btn.style.backgroundColor = i === index ? "#007bff" : "transparent";
                            btn.style.color = i === index ? "white" : "#333";
                        });
                        panelContainer.innerHTML = "";
                        panelContainer.appendChild(panels[index]);
                        if (index === 1) createSemestersChart(semestersGPA);
                        if (index === 2) createYearsChart(yearsGPA);
                        currentIndex = index;
                    }
                };

                tabButtons.push(tab);
                tabs.appendChild(tab);
            });

            return tabs;
        }

        // Container for tab panels
        function createPanelContainer() {
            const panelContainer = document.createElement("div");
            panelContainer.id = "panel-container";
            Object.assign(panelContainer.style, {
                flex: "1",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column"
            });
            return panelContainer;
        }

        // Create all tab panels
        async function createPanels(res) {
            const panels = [];

            // Overview panel
            const overviewPanel = document.createElement("div");
            overviewPanel.className = "panel-container";
            overviewPanel.style.width = "100%";
            overviewPanel.append(
                createHeader("Tổng quan sinh viên"),
                await createOverviewPanel(res)
            );
            panels.push(overviewPanel);

            // Semester chart panel
            const semesterPanel = document.createElement("div");
            semesterPanel.className = "panel";
            semesterPanel.style.textAlign = "center";
            semesterPanel.style.marginBottom = "20px";
            semesterPanel.append(
                createHeader("Biểu đồ điểm theo học kỳ"),
                createChartCanvas("semestersChart")
            );
            panels.push(semesterPanel);

            // Year chart panel
            const yearPanel = document.createElement("div");
            yearPanel.className = "panel";
            yearPanel.style.textAlign = "center";
            yearPanel.style.marginBottom = "20px";
            yearPanel.append(
                createHeader("Biểu đồ điểm theo năm"),
                createChartCanvas("yearsChart")
            );
            panels.push(yearPanel);

            return panels;
        }

        // Panel header
        function createHeader(title) {
            const header = document.createElement("div");
            header.className = "panel-header";
            header.style.textAlign = "center";
            header.style.marginBottom = "20px";
            header.innerHTML = `<h3 style="color: #007bff;">${title}</h3>`;
            return header;
        }

        // Chart canvas
        function createChartCanvas(id) {
            const canvas = document.createElement("canvas");
            canvas.id = id;
            canvas.style.width = "1100px";
            canvas.style.height = "450px";
            return canvas;
        }

        // Overview panel with student info and pie chart
        async function createOverviewPanel(res) {
            const overviewPanel = document.createElement("div");
            Object.assign(overviewPanel.style, {
                display: "flex",
                flexDirection: "row",
                gap: "20px",
                alignItems: "stretch"
            });

            overviewPanel.append(
                createLeftPanel(res),
                createRightPanel()
            );
            return overviewPanel;
        }

        // Student info table
        function createLeftPanel(res) {
            const leftPanel = document.createElement("div");
            leftPanel.id = "left-panel";
            Object.assign(leftPanel.style, {
                width: "50%",
                padding: "20px",
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
                border: "1px solid #ddd"
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

        // Pie chart panel
        function createRightPanel() {
            const rightPanel = document.createElement("div");
            rightPanel.id = "right-panel";
            Object.assign(rightPanel.style, {
                width: "50%",
                padding: "20px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#f8f9fa",
                borderRadius: "12px",
                boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)"
            });

            rightPanel.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center;">
                    <h4 style="margin-bottom: 15px; text-align: center; color: #007bff;">Biểu đồ thống kê</h4>
                    <canvas id="gradesChart" width="350" height="300"></canvas>
                </div>
            `;
            return rightPanel;
        }

        // Pie chart for grades
        function createPieChart(gradesCount) {
            const ctx = document.getElementById('gradesChart').getContext('2d');
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['A', 'B', 'C', 'D', 'F'],
                    datasets: [{
                        data: [
                            gradesCount.A || 0,
                            gradesCount.B || 0,
                            gradesCount.C || 0,
                            gradesCount.D || 0,
                            gradesCount.F || 0
                        ],
                        backgroundColor: [
                            '#28a745',
                            '#007bff',
                            '#ffc107',
                            '#dc3545',
                            '#bb35dc'
                        ],
                        borderColor: '#fff',
                        borderWidth: 3
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                font: { size: 14, weight: 'bold' },
                                color: '#333'
                            }
                        }
                    }
                }
            });
        }

        // Line chart for semesters
        function createSemestersChart(semestersGPA) {
            const ctx = document.getElementById('semestersChart').getContext('2d');
            const filtered = semestersGPA.filter(s => s.GPA10Semester !== 0);
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: filtered.map(s => s.semester),
                    datasets: [{
                        label: 'ĐTB hệ 10',
                        data: filtered.map(s => s.GPA10Semester),
                        borderColor: '#007bff',
                        backgroundColor: 'rgba(0, 123, 255, 0.2)',
                        fill: false,
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                font: { size: 14, weight: 'bold' },
                                color: '#333'
                            }
                        }
                    },
                    scales: {
                        x: { title: { display: true, text: 'Semester' } },
                        y: {
                            title: { display: true, text: 'GPA10' },
                            beginAtZero: true,
                            max: 4
                        }
                    }
                }
            });
        }

        // Line chart for years
        function createYearsChart(yearsGPA) {
            const ctx = document.getElementById('yearsChart').getContext('2d');
            const filtered = yearsGPA.filter(y => y.GPA10Year !== 0);
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: filtered.map(y => y.year),
                    datasets: [{
                        label: 'ĐTB hệ 10',
                        data: filtered.map(y => y.GPA10Year),
                        borderColor: '#007bff',
                        backgroundColor: 'rgba(0, 123, 255, 0.2)',
                        fill: false,
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                font: { size: 14, weight: 'bold' },
                                color: '#333'
                            }
                        }
                    },
                    scales: {
                        x: { title: { display: true, text: 'Year' } },
                        y: {
                            title: { display: true, text: 'GPA10' },
                            beginAtZero: true,
                            max: 4
                        }
                    }
                }
            });
        }

        // Close button for modal
        function createCloseButton(overlay, content) {
            const closeButton = document.createElement("span");
            closeButton.id = "close-button";
            closeButton.innerHTML = "&times;";
            Object.assign(closeButton.style, {
                position: "absolute",
                top: "10px",
                right: "15px",
                fontSize: "24px",
                cursor: "pointer",
                color: "#ff4d4d",
                fontWeight: "bold"
            });

            closeButton.onclick = () => {
                overlay.style.opacity = "0";
                content.style.opacity = "0";
                content.style.transform = "translateY(-20px)";
                setTimeout(() => overlay.remove(), 300);
            };

            overlay.onclick = (e) => {
                if (e.target === overlay) closeButton.onclick();
            };

            return closeButton;
        }

        // ======================== Calculator ========================

        

        // ===================== Floating buttons =====================

        // Styles button
        const style = document.createElement("style");
        style.innerHTML = `
            .ext-btn {
            position: fixed;
            top: 50%;
            right: 0px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            z-index: 9999;
            align-items: flex-end;
            }
            .btn-statistic, .btn-calculator {
            width: 50px; 
            height: 50px;
            padding: 10px;
            display: flex;
            justify-content: center;
            align-items: center;
            transition: width 0.3s ease-in-out, padding 0.3s ease-in-out;
            white-space: nowrap; 
            background: #007bff;
            color: white;
            border: none;
            border-radius: 5px 0 0 5px;
            cursor: pointer;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            font-size: 16px;
            overflow: hidden;
            }
            .btn-calculator {
            background: #28a745;
            }
            .btn-statistic:hover, .btn-calculator:hover {
            width: 180px; 
            padding: 10px 15px;
            }
            .btn-statistic span, .btn-calculator span {
            display: none; 
            }
            .btn-statistic:hover span, .btn-calculator:hover span {
            display: inline; 
            }
            .btn-statistic:hover svg, .btn-calculator:hover svg {
            display: none;    
            }
            .legend {
            text-align: center;
            margin-top: 10px;
            font-weight: bold;
            }
        `;

        // Create a container for the floating buttons
        function getOrCreateButtonGroup() {
            let group = document.getElementById("ext-btn");
            if (!group) {
                group = document.createElement("div");
                group.id = "ext-btn";
                group.className = "ext-btn";
                document.body.appendChild(group);
            }
            return group;
        }

        // Add floating statistics button
        function addButtonStatistic() {
            if (!document.head.querySelector('style[data-statistic-style]')) {
                style.setAttribute('data-statistic-style', 'true');
                document.head.appendChild(style);
            }

            const group = getOrCreateButtonGroup();

            // Avoid duplicate button
            if (group.querySelector('.btn-statistic')) return;

            const button = document.createElement("button");
            button.classList.add("btn-statistic");
            button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-graph-up" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M0 0h1v15h15v1H0zm14.817 3.113a.5.5 0 0 1 .07.704l-4.5 5.5a.5.5 0 0 1-.74.037L7.06 6.767l-3.656 5.027a.5.5 0 0 1-.808-.588l4-5.5a.5.5 0 0 1 .758-.06l2.609 2.61 4.15-5.073a.5.5 0 0 1 .704-.07"/>
            </svg>
            <span>Statistics</span>
            `;
            button.addEventListener("click", handleButtonStatistic);

            group.appendChild(button);
        }

        // Add floating calculator button
        function addButtonCalculator() {
            if (!document.head.querySelector('style[data-statistic-style]')) {
                style.setAttribute('data-statistic-style', 'true');
                document.head.appendChild(style);
            }

            const group = getOrCreateButtonGroup();

            // Avoid duplicate button
            if (group.querySelector('.btn-calculator')) return;

            const button = document.createElement("button");
            button.classList.add("btn-calculator");
            button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-calculator" viewBox="0 0 16 16">
            <path d="M2 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H2zm12 1a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h12z"/>
            <path d="M3 4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9A.5.5 0 0 1 3 4zm0 2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm2.5 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm2.5 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm2.5 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zM3 8a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1A.5.5 0 0 1 3 8zm2.5 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm2.5 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm2.5 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zM3 10a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm2.5 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm2.5 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm2.5 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5z"/>
            </svg>
            <span>Calculator</span>
            `;
            // TODO: Add your calculator click handler here
            button.addEventListener("click", () => {
                alert("Calculator button clicked!");
            });

            group.appendChild(button);
        }

        addButtonStatistic();
        addButtonCalculator();
    };
})();
