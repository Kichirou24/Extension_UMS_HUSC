(async () => {
    const utils = await import(chrome.runtime.getURL("scripts/utils.js"));

    // --- Score Conversion ---
    const convertScore10to4 = score =>
        score >= 8.5 ? 4.0 : score >= 7.0 ? 3.0 : score >= 5.5 ? 2.0 : score >= 4.0 ? 1.0 : 0.0;
    const convertAcademicPerformance = GPA4 =>
        GPA4 >= 3.6 ? 'Xuất sắc' : GPA4 >= 3.2 ? 'Giỏi' : GPA4 >= 2.5 ? 'Khá' : GPA4 >= 2.0 ? 'Trung bình' : 'Yếu';

    // --- Helper: convert score to color ---
    function getColor(score) {
        switch (score) {
            case 'A': return "#28a745";
            case 'B': return "#007bff";
            case 'C': return "#ffc107";
            case 'D': return "#dc3545";
            case 'F': return "#bb35dc";
            default: return "#6c757d";
        }
    }

    // --- Add/Update "Điểm chữ" column ---
    function updateMarkColumn() {
        // Add header if not exists
        const theadRows = document.querySelectorAll("table thead tr");
        if (theadRows.length === 2 && !theadRows[1].querySelector("th.diem-chu-th")) {
            const tongDiem1Index = Array.from(theadRows[1].children).findIndex(th => th.textContent.trim() === "Tổng điểm");
            if (tongDiem1Index !== -1) {
                const thiLan1Th = Array.from(theadRows[0].children).find(th => th.textContent.includes("Thi lần 1"));
                if (thiLan1Th) thiLan1Th.colSpan = 3;
                const thiLan2Th = Array.from(theadRows[0].children).find(th => th.textContent.includes("Thi lần 2"));
                if (thiLan2Th) thiLan2Th.colSpan = 3;
                const diemChuTh = document.createElement("th");
                diemChuTh.className = "text-center diem-chu-th";
                diemChuTh.textContent = "Điểm chữ";
                diemChuTh.style.width = "80px";
                theadRows[1].insertBefore(diemChuTh, theadRows[1].children[tongDiem1Index + 1]);
            }
        }
        // Update/insert mark cell for each row
        const tbodyRows = document.querySelectorAll("table tbody tr");
        tbodyRows.forEach(tr => {
            const sttCell = tr.querySelector("td");
            const isSTT = sttCell && /^\d+$/.test(sttCell.textContent.trim());
            if (isSTT) {
                const tds = tr.querySelectorAll("td");
                const tongDiemCell = tds[7];
                let diemChu = "";
                if (tongDiemCell) {
                    const score = parseFloat(tongDiemCell.textContent.trim());
                    if (!isNaN(score)) {
                        diemChu = utils.convertScore(score);
                    }
                }
                // Check if mark cell exists
                let markCell = tds[8];
                if (!markCell || !markCell.classList.contains("diem-chu-td")) {
                    markCell = document.createElement("td");
                    markCell.className = "text-center diem-chu-td";
                    tr.insertBefore(markCell, tds[8]);
                }
                markCell.textContent = diemChu;
                markCell.style.color = getColor(diemChu);
            }
        });
    }

    // --- GPA Floating UI ---
    function createFloatingGPA() {
        if (document.getElementById("gpaFloatingPanel")) return;
        const panel = document.createElement("div");
        panel.id = "gpaFloatingPanel";
        panel.style.cssText = `
            position: fixed; bottom: 20px; right: 20px; background: #fff;
            border: 1px solid #ccc; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);
            padding: 10px 15px; z-index: 9999; font-size: 14px; display: none;
        `;
        panel.innerHTML = `
            <div>GPA hệ 10: <strong id="gpa10Floating">--</strong></div>
            <div>GPA hệ 4: <strong id="gpa4Floating">--</strong></div>
        `;
        document.body.appendChild(panel);

        const updateVisibility = () => {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            panel.style.display = scrollTop > 200 ? "block" : "none";
        };

        updateVisibility();

        window.addEventListener("scroll", () => {
            updateVisibility();
        });
    }

    // --- GPA Display UI ---
    function insertGpaDisplay() {
        const container = document.querySelector(".container-fluid.form-horizontal");
        if (!container || document.getElementById("gpa10Display")) return;
        const row = document.createElement("div");
        row.className = "row form-group hitec-border-bottom-dotted";
        row.style.display = "flex";
        row.style.alignItems = "center";
        row.innerHTML = `
            <label class="col-sm-3 control-label">Điểm trung bình tích lũy (hệ 10):</label>
            <div class="col-sm-3" style="display:flex;align-items:center;min-height:24px;">
                <span id="gpa10Display" style="display:inline-block;line-height:1;"></span>
            </div>
            <label class="col-sm-3 control-label">Điểm trung bình tích lũy (hệ 4):</label>
            <div class="col-sm-3" style="display:flex;align-items:center;min-height:24px;">
                <span id="gpa4Display" style="display:inline-block;line-height:1;"></span>
            </div>
        `;
        container.appendChild(row);
    }

    // --- GPA Calculation ---
    async function updateGPA() {
        let totalScore10 = 0, totalScore4 = 0, totalCredits = 0;
        const courseRowMap = new Map();
        document.querySelectorAll("tr").forEach(row => {
            const cells = row.querySelectorAll("td.text-center");
            if (cells.length < 7) return;
            const courseCode = cells[1].textContent.trim();
            courseRowMap.set(courseCode, row);
        });
        for (const row of courseRowMap.values()) {
            const cells = row.querySelectorAll("td.text-center");
            if (cells.length < 7) continue;

            const avg = parseFloat(cells[6].textContent.trim());
            const credits = parseFloat(cells[2].textContent.trim());

            // Calculator GPA 4 and GPA 10
            if (!isNaN(avg) && !isNaN(credits) && avg >= 4.0) {
                totalScore10 += avg * credits;
                totalScore4 += convertScore10to4(avg) * credits;
                totalCredits += credits;
            }
        }
        const gpa10Display = document.getElementById("gpa10Display");
        const gpa4Display = document.getElementById("gpa4Display");
        if (gpa10Display && gpa4Display) {
            if (totalCredits > 0) {
                const gpa = totalScore10 / totalCredits;
                const gpa4 = totalScore4 / totalCredits;
                gpa10Display.textContent = `${gpa.toFixed(2)} (tổng ${totalCredits} tín chỉ)`;
                gpa4Display.textContent = `${gpa4.toFixed(2)} (Xếp loại: ${convertAcademicPerformance(gpa4)})`;
                const gpa10Floating = document.getElementById("gpa10Floating");
                const gpa4Floating = document.getElementById("gpa4Floating");
                if (gpa10Floating && gpa4Floating) {
                    gpa10Floating.textContent = gpa.toFixed(2);
                    gpa4Floating.textContent = gpa4.toFixed(2);
                }
            } else {
                gpa10Display.textContent = "Chưa có dữ liệu";
                gpa4Display.textContent = "Chưa có dữ liệu";
            }
        }
        updateMarkColumn();
    }

    // --- Add Editable Fields and Logic ---
    async function addFieldInput() {
        const courseRowMap = new Map();
        document.querySelectorAll("tr").forEach(row => {
            const cells = row.querySelectorAll("td.text-center");
            if (cells.length < 7) return;
            const courseCode = cells[1].textContent.trim();
            courseRowMap.set(courseCode, row);
        });

        const tasks = [];

        for (const [, row] of courseRowMap) {
            const cells = row.querySelectorAll("td.text-center");
            const courseId = row.querySelector("a[href^='/Course/Details/']")?.href;
            if (cells.length < 7 || !courseId) continue;

            tasks.push({ row, courseId, cells });
        }

        const qthtResults = await Promise.all(
            tasks.map(({ courseId }) => utils.calcQTHT(courseId))
        );

        for (let i = 0; i < tasks.length; i++) {
            const { row, courseId, cells } = tasks[i];
            const QTHT = qthtResults[i];
            const inputFields = [];

            for (let j = 4; j <= 5; j++) {
                const cell = cells[j];
                if (!cell || cell.querySelector("input")) continue;

                const input = document.createElement("input");
                input.type = "number";
                input.addEventListener("input", () => {
                    let value = parseFloat(input.value);
                    if (value < 0) input.value = 0;
                    else if (value > 10) input.value = 10;
                });

                Object.assign(input.style, {
                    width: "50px", padding: "2px 4px", fontSize: "12px", textAlign: "center",
                    MozAppearance: "textfield", appearance: "textfield", webkitAppearance: "none", margin: "0"
                });

                const oldValue = parseFloat(cell.textContent.trim());
                if (j === 4) {
                    if (QTHT !== 404)
                        input.value = QTHT.qtht.score.toFixed(1);
                    else
                        input.value = oldValue;
                } else {
                    input.value = oldValue;
                }

                cell.textContent = "";
                cell.appendChild(input);
                inputFields[j] = input;
            }

            const handleInput = async () => {
                const scoreProcess = parseFloat(inputFields[4]?.value);
                const scoreExam = parseFloat(inputFields[5]?.value);
                if (!isNaN(scoreProcess) && !isNaN(scoreExam)) {
                    try {
                        const infoCourse = await utils.getInfoCourseGeneral(courseId);
                        const ratioProcess = parseFloat(infoCourse.qtht) || 0;
                        const ratioExam = parseFloat(infoCourse.thi) || 0;
                        if (ratioProcess + ratioExam === 1) {
                            cells[6].textContent = (scoreProcess * ratioProcess + scoreExam * ratioExam).toFixed(1);
                            updateGPA();
                        }
                    } catch (e) {
                        console.error("Lỗi khi lấy thông tin môn học:", e);
                    }
                } else {
                    cells[6].textContent = "";
                    updateGPA();
                }
            };

            inputFields.forEach(input => input && input.addEventListener("input", handleInput));
            if (inputFields[4]?.value && inputFields[5]?.value) handleInput();
        }

        if (!document.getElementById("gpa10Display")) {
            const style = document.createElement('style');
            style.textContent = `
                input[type=number]::-webkit-inner-spin-button, 
                input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
                input[type=number] { -moz-appearance: textfield; }
            `;
            document.head.appendChild(style);
        }
        insertGpaDisplay();
        createFloatingGPA();
        updateGPA();
    }

    addFieldInput();
})();