(async () => {
    const utils = await import(chrome.runtime.getURL("scripts/utils.js"));

    const chartJsScript = document.createElement('script');
    chartJsScript.src = await chrome.runtime.getURL('scripts/libs/Chart.min.js');
    document.head.appendChild(chartJsScript);

    chartJsScript.onload = async () => {
        async function handleButtonClick() {
            const res = await utils.getInfo();
            const semestersGPA = await utils.caclSemestersGPA();
            const yearsGPA = await utils.caclYearsGPA();
            const overlay = createOverlay();
            const content = createContent();
            const panelContainer = createPanelContainer();
            const panels = await createPanels(res);
            const tabs = createTabs(panelContainer, panels, semestersGPA, yearsGPA);

            panelContainer.appendChild(panels[0]);
            content.appendChild(createCloseButton(overlay, content));
            content.appendChild(tabs);
            content.appendChild(panelContainer);
            overlay.appendChild(content);
            document.body.appendChild(overlay);

            setTimeout(() => {
                overlay.style.opacity = "1";
                content.style.opacity = "1";
                content.style.transform = "translateY(0)";
            }, 10);

            createPieChart(res.gradesCount);
        }

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

        async function createPanels(res) {
            const panels = [];
            const container = document.createElement("div");
            container.className = "panel-container";
            container.style.width = "100%";

            const header = document.createElement("div");
            header.className = "panel-header";
            header.style.textAlign = "center";
            header.style.marginBottom = "20px";
            header.innerHTML = `<h3 style="color: #007bff;">Tổng quan sinh viên</h3>`;

            const overviewPanel = await createOverviewPanel(res);
            container.appendChild(header);
            container.appendChild(overviewPanel);
            panels.push(container);

            const semesterPanel = document.createElement("div");
            semesterPanel.className = "panel";
            semesterPanel.style.textAlign = "center";
            semesterPanel.style.marginBottom = "20px";
            semesterPanel.innerHTML = `<h3 style="color: #007bff;">Biểu đồ điểm theo học kỳ</h3>`;
            const semesterChart = document.createElement("canvas");
            semesterChart.id = "semestersChart";
            semesterChart.style.width = "1100px";
            semesterChart.style.height = "450px";
            semesterPanel.appendChild(semesterChart);
            panels.push(semesterPanel);
            
            const yearPanel = document.createElement("div");
            yearPanel.className = "panel";
            yearPanel.style.textAlign = "center";
            yearPanel.style.marginBottom = "20px";
            yearPanel.innerHTML = `<h3 style="color: #007bff;">Biểu đồ điểm theo năm</h3>`;
            const yearChart = document.createElement("canvas");
            yearChart.id = "yearsChart";
            yearChart.style.width = "1100px";
            yearChart.style.height = "450px";
            yearPanel.appendChild(yearChart);
            panels.push(yearPanel);

            return panels;
        }

        async function createOverviewPanel(res) {
            const overviewPanel = document.createElement("div");
            overviewPanel.className = "overview-panel";
            Object.assign(overviewPanel.style, {
                display: "flex",
                flexDirection: "row",
                gap: "20px",
                alignItems: "stretch"
            });

            const leftPanel = createLeftPanel(res);
            const rightPanel = createRightPanel();

            overviewPanel.appendChild(leftPanel);
            overviewPanel.appendChild(rightPanel);

            return overviewPanel;
        }

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

        function createPieChart(gradesCount) {
            const ctxGradesChart = document.getElementById('gradesChart').getContext('2d');
            new Chart(ctxGradesChart, {
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
                                font: {
                                    size: 14,
                                    weight: 'bold'
                                },
                                color: '#333'
                            }
                        }
                    }
                }
            });
        }

        function createSemestersChart(semestersGPA) {
            const ctxSemestersChart = document.getElementById('semestersChart').getContext('2d');
            new Chart(ctxSemestersChart, {
                type: 'line',
                data: {
                    labels: semestersGPA.filter(semester => semester.GPA10Semester !== 0).map(semester => semester.semester),
                    datasets: [{
                        label: 'ĐTB hệ 10',
                        data: semestersGPA.filter(semester => semester.GPA10Semester !== 0).map(semester => semester.GPA10Semester),
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
                                font: {
                                    size: 14,
                                    weight: 'bold'
                                },
                                color: '#333'
                            }
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Semester'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'GPA10'
                            },
                            beginAtZero: true,
                            max: 4
                        }
                    }
                }
            });
        }

        function createYearsChart(yearsGPA) {
            const ctxSYearsChart = document.getElementById('yearsChart').getContext('2d');
            new Chart(ctxSYearsChart, {
                type: 'line',
                data: {
                    labels: yearsGPA.filter(year => year.GPA10Year !== 0).map(year => year.year),
                    datasets: [{
                        label: 'ĐTB hệ 10',
                        data: yearsGPA.filter(year => year.GPA10Year !== 0).map(year => year.GPA10Year),
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
                                font: {
                                    size: 14,
                                    weight: 'bold'
                                },
                                color: '#333'
                            }
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Year'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'GPA10'
                            },
                            beginAtZero: true,
                            max: 4
                        }
                    }
                }
            });
        }

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

        const style = document.createElement("style");
        style.innerHTML = `
            .btn-statistic {
                width: 50px; 
                height: 50px;
                padding: 10px;
                display: flex;
                justify-content: center;
                align-items: center;
                transition: width 0.3s ease-in-out, padding 0.3s ease-in-out;
                white-space: nowrap; 
            }

            .btn-statistic:hover {
                width: 180px; 
                padding: 10px 15px;
            }

            .btn-statistic span {
                display: none; 
            }

            .btn-statistic:hover span {
                display: inline; 
            }

            .btn-statistic:hover svg {
                display: none;    
            }

            .legend {
                text-align: center;
                margin-top: 10px;
                font-weight: bold;
            }
        `;

        function addButtonStatistic() {
            document.head.appendChild(style);

            const button = document.createElement("button");
            button.classList.add("btn-statistic");

            button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-graph-up" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M0 0h1v15h15v1H0zm14.817 3.113a.5.5 0 0 1 .07.704l-4.5 5.5a.5.5 0 0 1-.74.037L7.06 6.767l-3.656 5.027a.5.5 0 0 1-.808-.588l4-5.5a.5.5 0 0 1 .758-.06l2.609 2.61 4.15-5.073a.5.5 0 0 1 .704-.07"/>
        </svg>
        <span>Statistics</span>
    `;

            Object.assign(button.style, {
                position: "fixed",
                top: "50%",
                right: "0px",
                transform: "translateY(-50%)",
                overflow: "hidden",
                background: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "5px 0 0 5px",
                cursor: "pointer",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                zIndex: "9999",
                fontSize: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            });

            document.body.appendChild(button);

            button.addEventListener("click", handleButtonClick);
        }

        addButtonStatistic();
    }
})();