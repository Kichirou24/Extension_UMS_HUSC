// --- Grade Conversion ---
export function convertScore(score) {
    if (score >= 8.5) return 'A';
    if (score >= 7.0) return 'B';
    if (score >= 5.5) return 'C';
    if (score >= 4.0) return 'D';
    return 'F';
}
export function convertAcademicPerformance(GPA4) {
    if (GPA4 >= 3.6) return 'Xuất sắc';
    if (GPA4 >= 3.2) return 'Giỏi';
    if (GPA4 >= 2.5) return 'Khá';
    if (GPA4 >= 2.0) return 'Trung bình';
    return 'Yếu';
}

// --- DOM Helpers ---
const parseHTML = html => new DOMParser().parseFromString(html, "text/html");
const getText = (doc, selector) => doc.querySelector(selector)?.textContent.trim() || "";

// --- Main Info Fetcher ---
export async function getInfo() {
    const doc = parseHTML(await (await fetch("https://student.husc.edu.vn/Statistics/StudyResult/")).text());
    const res = {
        fullname: getText(doc, "#wrapper .panel-sidebar-left .hitec-information > h5"),
        admissionCourse: getText(doc, "#wrapper .panel-main-content .container-fluid.form-horizontal > div:nth-child(1) > div > p"),
        fieldOfStudy: getText(doc, "#wrapper .panel-main-content .container-fluid.form-horizontal > div:nth-child(2) > div > p"),
        totalCredits: parseFloat(getText(doc, "#wrapper .panel-main-content .container-fluid.form-horizontal > div:nth-child(4) > div.col-xs-2 > p").replace(",", ".")),
        GPA4: parseFloat(getText(doc, "#wrapper .panel-main-content .container-fluid.form-horizontal > div:nth-child(4) > div.col-xs-3 > p").replace(",", "."))
    };
    let GPA10 = 0, gradesCount = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    doc.querySelectorAll("tr").forEach(row => {
        const cells = row.querySelectorAll("td.text-center");
        if (cells.length >= 6) {
            const score = parseFloat(cells[4].textContent.trim());
            const credit = parseFloat(cells[1].textContent.trim());
            if (!isNaN(score)) {
                const grade = convertScore(score);
                gradesCount[grade]++;
                if (grade !== 'F') GPA10 += score * credit;
            }
        }
    });
    res.GPA10 = Math.round((GPA10 / res.totalCredits) * 100) / 100;
    res.gradesCount = gradesCount;
    res.academicPerformance = convertAcademicPerformance(res.GPA4);
    return res;
}

// --- Course Info Fetchers ---
export async function getInfoCourse(courseId, scoreExam) {
    const doc = parseHTML(await (await fetch(courseId)).text());
    const findFieldset = label =>
        Array.from(doc.querySelectorAll("fieldset legend"))
            .find(legend => legend.textContent.trim().includes(label))
            ?.parentElement.outerHTML || "";
    return {
        infoGeneral: findFieldset("Thông tin chung"),
        evaluationResults: findFieldset("Kết quả đánh giá quá trình học tập"),
        scoringMethod: findFieldset("Cách đánh giá điểm quá trình học"),
        scorePass: await caclScorePass(doc, scoreExam)
    };
}
export async function getInfoCourseGeneral(courseId) {
    const doc = parseHTML(await (await fetch(`${courseId}`)).text());
    const scoringMethod = Array.from(doc.querySelectorAll("fieldset legend"))
        .find(legend => legend.textContent.trim().includes("Cách đánh giá điểm quá trình học"))
        ?.parentElement.outerHTML || "";
    let qtht = 0, thi = 0;
    const ratioMatch = scoringMethod.match(/QTHT\s*x\s*(\d+)%\s*\+\s*Điểm thi\s*x\s*(\d+)%/i);
    if (ratioMatch) {
        qtht = parseInt(ratioMatch[1], 10) / 100;
        thi = parseInt(ratioMatch[2], 10) / 100;
    }
    return { qtht, thi };
}

// --- Score Extraction ---
export async function getScore(data) {
    const table = data.querySelector("fieldset table");
    if (!table) return;
    const headers = table.querySelectorAll("thead th");
    const dataScore = [];
    table.querySelectorAll("tbody tr").forEach(row => {
        row.querySelectorAll("td.text-center").forEach((cell, index) => {
            const score = parseFloat(cell.textContent) || 0;
            const percentMatch = headers[index]?.innerHTML.match(/\((\d+)%\)/);
            if (percentMatch) {
                dataScore.push({
                    score,
                    percent: parseFloat(percentMatch[1]) / 100
                });
            }
        });
    });
    return dataScore.length === 0 ? 404 : dataScore;
}

// --- Calculate Passing Scores ---
export async function caclScorePass(data, scoreExam) {
    const dataScore = await getScore(data);
    if (dataScore === 404) return 404;
    let qthtScore4 = 0, totalPercent = 0;
    dataScore.forEach(item => {
        qthtScore4 += item.score * item.percent;
        totalPercent += item.percent;
    });
    const qthtScore10 = qthtScore4 / totalPercent;
    const calcPass = target => Math.max(0, Math.round(((target - qthtScore10 * totalPercent) / (1 - totalPercent)) * 4) / 4);
    return {
        A: calcPass(8.5),
        B: calcPass(7.0),
        C: calcPass(5.5),
        D: calcPass(4.0)
    };
}

// --- Semester/Year Extraction Helpers ---
const extractSemester = text => {
    const match = text.match(/Học kỳ: (\d+) - Năm học: (\d{4}-\d{4})/);
    return match ? `${match[2]}.${match[1]}` : null;
};
const extractYear = text => {
    const match = text.match(/Học kỳ: (\d+) - Năm học: (\d{4}-\d{4})/);
    return match ? match[2] : null;
};

// --- Extract Grades by Semester ---
async function extractGrades() {
    const semesters = [];
    let curSemester = null;
    document.querySelectorAll("tbody tr").forEach(row => {
        const cells = row.querySelectorAll("td");
        if (cells.length === 2 && cells[0].colSpan === 4) {
            curSemester = {
                semester: extractSemester(cells[0].innerText.trim()),
                year: extractYear(cells[0].innerText.trim()),
                courses: []
            };
            semesters.push(curSemester);
        } else if (cells.length === 10 && curSemester) {
            curSemester.courses.push({
                id: cells[0].innerText.trim(),
                name: cells[1].innerText.trim(),
                credit: parseFloat(cells[3].innerText.trim()),
                score: parseFloat(cells[7].innerText.trim()) || 0
            });
        }
    });
    return semesters;
}

// --- Calculate GPA per Semester ---
export async function caclSemestersGPA() {
    const semesters = await extractGrades();
    semesters.forEach(semester => {
        let semesterCredits = 0, semesterPoints = 0;
        semester.courses.forEach(course => {
            if (course.score >= 4.0) {
                semesterCredits += course.credit;
                semesterPoints += course.credit * course.score;
            }
        });
        semester.GPA10Semester = Math.round((semesterPoints / semesterCredits) * 100) / 100 || 0;
    });
    return semesters;
}

// --- Calculate GPA per Year ---
export async function caclYearsGPA() {
    const semesters = await extractGrades();
    const years = {};
    semesters.forEach(semester => {
        if (!years[semester.year]) years[semester.year] = { semesters: [], GPA10Year: 0 };
        years[semester.year].semesters.push(semester);
    });
    return Object.entries(years).map(([year, data]) => {
        let yearCredits = 0, yearPoints = 0;
        data.semesters.forEach(semester => {
            semester.courses.forEach(course => {
                if (course.score >= 4.0) {
                    yearCredits += course.credit;
                    yearPoints += course.credit * course.score;
                }
            });
        });
        data.GPA10Year = Math.round((yearPoints / yearCredits) * 100) / 100 || 0;
        return { year, GPA10Year: data.GPA10Year };
    });
}