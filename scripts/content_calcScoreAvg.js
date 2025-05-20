(async () => {
    const utils = await import(chrome.runtime.getURL("scripts/utils.js"));

    function addFieldInput() {
        const allRows = document.querySelectorAll("tr");
        let totalCredits = 0;
        let totalWeightedScore = 0;

        allRows.forEach(row => {
            const cells = row.querySelectorAll("td.text-center");
            if (cells.length < 7) return;

            const inputFields = [];

            for (let i = 4; i <= 5; i++) {
                const cell = cells[i];
                if (!cell || cell.querySelector("input")) continue;

                const input = document.createElement("input");
                input.type = "number";
                input.min = "0";
                input.max = "10";
                input.step = "any";
                input.style.MozAppearance = "textfield";
                input.style.appearance = "textfield";
                Object.assign(input.style, {
                    width: "50px",
                    padding: "2px 4px",
                    fontSize: "12px",
                    textAlign: "center"
                });
                input.style.webkitAppearance = "none";
                input.style.margin = "0";

                const oldValue = parseFloat(cell.textContent.trim());
                if (!isNaN(oldValue)) {
                    input.value = oldValue;
                }

                cell.textContent = "";
                cell.appendChild(input);
                inputFields[i] = input;
            }

            const courseLink = row.querySelector('a[href^="/Course/Details/"]');
            if (!courseLink) return;
            const courseId = courseLink.getAttribute("href");

            const handleInput = async () => {
                const scoreProcess = parseFloat(inputFields[4]?.value);
                const scoreExam = parseFloat(inputFields[5]?.value);

                if (!isNaN(scoreProcess) && !isNaN(scoreExam)) {
                    try {
                        const res = await utils.getInfoCourseGeneral(courseId);

                        const ratioProcess = parseFloat(res.qtht) || 0;
                        const ratioExam = parseFloat(res.thi) || 0;

                        if (ratioProcess + ratioExam > 0) {
                            const average = (scoreProcess * ratioProcess + scoreExam * ratioExam).toFixed(1);
                            cells[6].textContent = average;

                            updateGPA();
                        }
                    } catch (e) {
                        console.error("Lỗi khi lấy thông tin môn học:", e);
                    }
                }
            };

            inputFields.forEach(input => {
                if (input) input.addEventListener("input", handleInput);
            });

            // Tự động tính nếu đã có sẵn dữ liệu
            if (inputFields[4]?.value && inputFields[5]?.value) {
                handleInput();
            }
        });

        const style = document.createElement('style');
        style.textContent = `
            input[type=number]::-webkit-inner-spin-button, 
            input[type=number]::-webkit-outer-spin-button { 
                -webkit-appearance: none; 
                margin: 0; 
            }
            input[type=number] {
                -moz-appearance: textfield;
            }
        `;
        document.head.appendChild(style);

        insertGpaDisplay();
        updateGPA();
    }

    function convertScore(score) {
        if (score >= 8.5) return 4.0;
        if (score >= 7.0) return 3.0;
        if (score >= 5.5) return 2.0;
        if (score >= 4.0) return 1.0;
        return 0.0;
    }

    function convertAcademicPerformance(GPA4) {
    if (GPA4 >= 3.6) return 'Xuất sắc';
    if (GPA4 >= 3.2) return 'Giỏi';
    if (GPA4 >= 2.5) return 'Khá';
    if (GPA4 >= 2.0) return 'Trung bình';
    return 'Yếu';
}

    function insertGpaDisplay() {
        const container = document.querySelector(".container-fluid.form-horizontal");
        if (!container) return;

        const row = document.createElement("div");
        row.className = "row form-group hitec-border-bottom-dotted";
        row.style.display = "flex";
        row.style.alignItems = "center";

        const label = document.createElement("label");
        label.className = "col-sm-3 control-label";
        label.textContent = "Điểm trung bình tích lũy (hệ 10):";

        const valueDiv = document.createElement("div");
        valueDiv.className = "col-sm-3";
        valueDiv.style.display = "flex";
        valueDiv.style.alignItems = "center";
        valueDiv.style.minHeight = "24px";
        valueDiv.innerHTML = `<span id="gpa10Display" style="display:inline-block; line-height:1; margin:0; padding:0;"></span>`;

        const label4 = document.createElement("label");
        label4.className = "col-sm-3 control-label";
        label4.textContent = "Điểm trung bình tích lũy (hệ 4):";

        const valueDiv4 = document.createElement("div");
        valueDiv4.className = "col-sm-3";
        valueDiv4.style.display = "flex";
        valueDiv4.style.alignItems = "center";
        valueDiv4.style.minHeight = "24px";
        valueDiv4.innerHTML = `<span id="gpa4Display" style="display:inline-block; line-height:1; margin:0; padding:0;"></span>`;

        row.appendChild(label);
        row.appendChild(valueDiv);
        row.appendChild(label4);
        row.appendChild(valueDiv4);

        container.appendChild(row);
    }

    function updateGPA() {
        let totalScore10 = 0;
        let totalScore4 = 0;
        let totalCredits = 0;

        document.querySelectorAll("tr").forEach(row => {
            const cells = row.querySelectorAll("td.text-center");
            if (cells.length < 7) return;

            const avgText = cells[6].textContent.trim();
            const creditText = cells[2].textContent.trim();

            const avg = parseFloat(avgText);
            const credits = parseInt(creditText);

            if (!isNaN(avg) && !isNaN(credits)) {
                totalScore10 += avg * credits;
                totalScore4 += convertScore(avg) * credits;
                totalCredits += credits;
            }
        });

        const gpa10Display = document.getElementById("gpa10Display");
        const gpa4Display = document.getElementById("gpa4Display");
        if (gpa10Display && gpa4Display) {
            if (totalCredits > 0) {
                const gpa = totalScore10 / totalCredits;
                gpa10Display.textContent = `${gpa.toFixed(2)} (tổng ${totalCredits} tín chỉ)`;
                const gpa4 = totalScore4 / totalCredits;
                gpa4Display.textContent = `${gpa4.toFixed(2)} (Xếp loại: ${convertAcademicPerformance(gpa4)})`;
            } else {
                gpa10Display.textContent = "Chưa có dữ liệu";
                gpa4Display.textContent = "Chưa có dữ liệu";
            }
        }
    }


    addFieldInput();
})();
