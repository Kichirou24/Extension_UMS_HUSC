async function convertScore(score) {
    if (score >= 8.5) return 'A';
    else if (score >= 7.0) return 'B';
    else if (score >= 5.5) return 'C';
    else if (score >= 4.0) return 'D';
    else return 'F';
}

async function convertAcademicPerformance(GPA4) {
    if (GPA4 >= 3.6) return 'Xuất sắc';
    else if (GPA4 >= 3.2) return 'Giỏi';
    else if (GPA4 >= 2.5) return 'Khá';
    else if (GPA4 >= 2.0) return 'Trung bình';
    else return 'Yếu';
}

export async function getInfo() {
    let res = {};
    const response = await fetch(`https://student.husc.edu.vn/Statistics/StudyResult/`);
    const data = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(data, "text/html");

    let admissionCourse = doc.querySelector("#wrapper > div.panel-main-content > div > div > div > div.container-fluid.form-horizontal > div:nth-child(1) > div > p").textContent;
    let fieldOfStudy = doc.querySelector("#wrapper > div.panel-main-content > div > div > div > div.container-fluid.form-horizontal > div:nth-child(2) > div > p").textContent;
    let totalCredits = doc.querySelector("#wrapper > div.panel-main-content > div > div > div > div.container-fluid.form-horizontal > div:nth-child(4) > div.col-xs-2 > p").textContent;
    let fullname = doc.querySelector("#wrapper > div.panel-sidebar-left > div > div.hitec-information > h5").textContent;

    totalCredits = parseFloat(totalCredits.replace(",", "."));
    let GPA4 = doc.querySelector("#wrapper > div.panel-main-content > div > div > div > div.container-fluid.form-horizontal > div:nth-child(4) > div.col-xs-3 > p").textContent;
    GPA4 = parseFloat(GPA4.replace(",", "."));
    let GPA10 = 0;

    let gradesCount = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    doc.querySelectorAll("tr").forEach(async row => {
        let ceil = row.querySelectorAll("td.text-center");
        if (ceil.length >= 6) {
            let score = parseFloat(ceil[4].textContent.trim());
            let credit = parseFloat(ceil[1].textContent.trim());

            if (!isNaN(score)) {
                let grade = await convertScore(score);
                gradesCount[grade]++;

                if (grade !== 'F')
                    GPA10 += (score * credit);
            }
        }
    })

    GPA10 = Math.round((GPA10 / totalCredits) * 100) / 100;
    
    let academicPerformance = await convertAcademicPerformance(GPA4);
    res = { fullname: fullname, admissionCourse: admissionCourse, fieldOfStudy: fieldOfStudy, totalCredits: totalCredits, GPA4: GPA4, GPA10: GPA10, gradesCount: gradesCount, academicPerformance: academicPerformance };
    return res;
}

export async function getInfoCourse(courseId, scoreExam) {
    let res = {};
    const response = await fetch(`${courseId}`);
    const data = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(data, "text/html");

    const infoGeneral = Array.from(doc.querySelectorAll("fieldset legend"))
        .find(legend => legend.textContent.trim() === "Thông tin chung")
        ?.parentElement.outerHTML || "";

    const evaluationResults = Array.from(doc.querySelectorAll("fieldset legend"))
        .find(legend => legend.textContent.trim() === "Kết quả đánh giá quá trình học tập")
        ?.parentElement.outerHTML || "";

    const scoringMethod = Array.from(doc.querySelectorAll("fieldset legend"))
        .find(legend => legend.textContent.trim().includes("Cách đánh giá điểm quá trình học"))
        ?.parentElement.outerHTML || "";

    const scorePass = await caclScorePass(doc, scoreExam);

    res = { infoGeneral, evaluationResults, scoringMethod, scorePass };

    return res;
}

export async function getScore(data) {
    let table = data.querySelector("fieldset table");
    if (!table) return;

    let headers = table.querySelectorAll("thead th");
    let rows = table.querySelectorAll("tbody tr");

    let dataScore = [];

    rows.forEach(row => {
        let cells = row.querySelectorAll("td.text-center");

        let totalScore = 0;
        let totalPercent = 0;

        cells.forEach((cell, index) => {
            let score = parseFloat(cell.textContent) || 0;
            let percentMatch = headers[index]?.innerHTML.match(/\((\d+)%\)/);

            if (percentMatch) {
                dataScore.push({
                    score: score,
                    percent: parseFloat(percentMatch[1]) / 100
                });
            }
        });
    });

    if (dataScore.length === 0) return 404;

    return dataScore;
}

export async function caclScorePass(data, scoreExam) {
    let dataScore = await getScore(data);
    if (dataScore === 404) return 404;

    let qthtScore4 = 0;
    let totalPercent = 0;
    for (let i = 0; i < dataScore.length; i++) {
        qthtScore4 += dataScore[i].score * dataScore[i].percent;
        totalPercent += dataScore[i].percent;
    }
    let qthtScore10 = qthtScore4 / totalPercent;
    scoreExam = parseFloat(scoreExam);

    let scorePassA = Math.round(((8.5 - qthtScore10 * totalPercent) / (1 - totalPercent)) * 4) / 4;
    let scorePassB = Math.round(((7.0 - qthtScore10 * totalPercent) / (1 - totalPercent)) * 4) / 4;
    let scorePassC = Math.round(((5.5 - qthtScore10 * totalPercent) / (1 - totalPercent)) * 4) / 4;
    let scorePassD = Math.round(((4.0 - qthtScore10 * totalPercent) / (1 - totalPercent)) * 4) / 4;

    let scorePass = {
        A: scorePassA < 0 ? 0 : scorePassA,
        B: scorePassB < 0 ? 0 : scorePassB,
        C: scorePassC < 0 ? 0 : scorePassC,
        D: scorePassD < 0 ? 0 : scorePassD
    };

    return scorePass;
}