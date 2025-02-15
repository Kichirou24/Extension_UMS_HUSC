function convertScore(score) {
    if (score >= 8.5) return 'A';
    else if (score >= 7.0) return 'B';
    else if (score >= 5.5) return 'C';
    else if (score >= 4.0) return 'D';
    else return 'F';
}

export function countGradesAndCredits() {
    let gradesCount = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    let totalCredits = 0;

    document.querySelectorAll("tr").forEach(row => {
        let ceil = row.querySelectorAll("td.text-center");
        if (ceil.length >= 6) {
            let score = parseFloat(ceil[6].textContent.trim());
            if (!isNaN(score)) {
                let grade = convertScore(score);
                gradesCount[grade]++;

                if (grade !== 'F') {
                    let credit = parseInt(ceil[2].textContent.trim());
                    totalCredits += credit;
                }
            }
        }
    })

    return { gradesCount: gradesCount, totalCredits: totalCredits };
}

export function getInfo() {
    let fullName = document.querySelector("#wrapper > div.panel-sidebar-left > div > div.hitec-information > h5").textContent.trim();
    let cource = document.querySelector("#wrapper > div.panel-main-content > div > div > div > div.container-fluid.form-horizontal > div:nth-child(1) > div > p").textContent.trim();
    let major = document.querySelector("#wrapper > div.panel-main-content > div > div > div > div.container-fluid.form-horizontal > div:nth-child(2) > div > p").textContent.trim();

    return { fullName: fullName, cource: cource, major: major };
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

    res = { infoGeneral, evaluationResults, scoringMethod };
    
    caclScorePass(doc, scoreExam);

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

    return dataScore;
}

export async function caclScorePass(data, scoreExam) {
    let dataScore = await getScore(data);
    if (!dataScore) return;

    let qthtScore = 0;
    let totalPercent = 0;
    for (let i = 0; i < dataScore.length; i++) {
        qthtScore += dataScore[i].score * dataScore[i].percent;
        totalPercent += dataScore[i].percent;
    }

    scoreExam = parseFloat(scoreExam);

    let score = scoreExam * (1 - totalPercent) + qthtScore;

    return score;
}