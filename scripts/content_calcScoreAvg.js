(async () => {
    const utils = await import(chrome.runtime.getURL("scripts/utils.js"));

    // --- Score Conversion ---
    const convertScore10to4 = score =>
        score >= 8.5 ? 4.0 : score >= 7.0 ? 3.0 : score >= 5.5 ? 2.0 : score >= 4.0 ? 1.0 : 0.0;
    const convertAcademicPerformance = GPA4 =>
        GPA4 >= 3.6 ? 'Xuất sắc' : GPA4 >= 3.2 ? 'Giỏi' : GPA4 >= 2.5 ? 'Khá' : GPA4 >= 2.0 ? 'Trung bình' : 'Yếu';

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
    function updateGPA() {
        let totalScore10 = 0, totalScore4 = 0, totalCredits = 0;
        const courseRowMap = new Map();

        document.querySelectorAll("tr").forEach(row => {
            const cells = row.querySelectorAll("td.text-center");
            if (cells.length < 7) return;

            const courseCode = cells[1].textContent.trim();
            courseRowMap.set(courseCode, row);
        });

        courseRowMap.forEach((row, courseCode) => {
            const cells = row.querySelectorAll("td.text-center");
            if (cells.length < 7) return;

            const avg = parseFloat(cells[6].textContent.trim());
            const credits = parseFloat(cells[2].textContent.trim());

            if (!isNaN(avg) && !isNaN(credits)) {
                totalScore10 += avg * credits;
                totalScore4 += convertScore10to4(avg) * credits;
                totalCredits += credits;
            }
        });

        const gpa10Display = document.getElementById("gpa10Display");
        const gpa4Display = document.getElementById("gpa4Display");
        if (gpa10Display && gpa4Display) {
            if (totalCredits > 0) {
                const gpa = totalScore10 / totalCredits;
                const gpa4 = totalScore4 / totalCredits;
                gpa10Display.textContent = `${gpa.toFixed(2)} (tổng ${totalCredits} tín chỉ)`;
                gpa4Display.textContent = `${gpa4.toFixed(2)} (Xếp loại: ${convertAcademicPerformance(gpa4)})`;
            } else {
                gpa10Display.textContent = "Chưa có dữ liệu";
                gpa4Display.textContent = "Chưa có dữ liệu";
            }
        }
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

        for (const [courseCode, row] of courseRowMap) {
            const cells = row.querySelectorAll("td.text-center");
            const courseId = row.querySelector("a[href^='/Course/Details/']")?.href;
            if (cells.length < 7) continue;
            const inputFields = [];

            for (let i = 4; i <= 5; i++) {
                const cell = cells[i];
                if (!cell || cell.querySelector("input")) continue;
                const input = document.createElement("input");
                input.type = "number";
                input.min = "0";
                input.max = "10";
                input.step = "any";
                Object.assign(input.style, {
                    width: "50px", padding: "2px 4px", fontSize: "12px", textAlign: "center",
                    MozAppearance: "textfield", appearance: "textfield", webkitAppearance: "none", margin: "0"
                });
                const oldValue = parseFloat(cell.textContent.trim());
                if (!isNaN(oldValue)) input.value = oldValue;
                cell.textContent = "";
                cell.appendChild(input);
                inputFields[i] = input;
            }

            const handleInput = async () => {
                const scoreProcess = parseFloat(inputFields[4]?.value);
                const scoreExam = parseFloat(inputFields[5]?.value);
                if (!isNaN(scoreProcess) && !isNaN(scoreExam)) {
                    try {
                        const res = await utils.getInfoCourseGeneral(courseId);
                        const ratioProcess = parseFloat(res.qtht) || 0;
                        const ratioExam = parseFloat(res.thi) || 0;
                        if (ratioProcess + ratioExam > 0) {
                            cells[6].textContent = (scoreProcess * ratioProcess + scoreExam * ratioExam).toFixed(1);
                            updateGPA();
                        }
                    } catch (e) {
                        console.error("Lỗi khi lấy thông tin môn học:", e);
                    }
                }
            };

            inputFields.forEach(input => input && input.addEventListener("input", handleInput));
            if (inputFields[4]?.value && inputFields[5]?.value) handleInput();
        }

        // Style cho input
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
        updateGPA();
    }

    addFieldInput();
})();
