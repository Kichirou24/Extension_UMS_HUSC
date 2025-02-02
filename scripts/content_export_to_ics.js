// Function export ICS
function exportToICS() {
    const nameFile = prompt("Enter the name of the file", "Schedule");

    function convertStartTime(period) {
        const periodMap = {
            "0": "00:00",
            "1": "07:00",
            "2": "08:00",
            "3": "09:00",
            "4": "10:00",
            "5": "13:00",
            "6": "14:00",
            "7": "15:00",
            "8": "16:00",
            "9": "17:30",
            "10": "18:30",
            "11": "19:30",
            "12": "20:30",
        };
        return periodMap[period];
    }

    function convertEndTime(period) {
        const periodMap = {
            "0": "00:00",
            "1": "07:45",
            "2": "08:45",
            "3": "09:45",
            "4": "10:45",
            "5": "13:45",
            "6": "14:45",
            "7": "15:45",
            "8": "16:45",
            "9": "18:15",
            "10": "19:15",
            "11": "20:15",
            "12": "21:15",
        };
        return periodMap[period];
    }

    function nextDay(day, time) {
        const [dayStr, monthStr, yearStr] = day.split('/');
        const date = new Date(parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr));
        date.setDate(date.getDate() + time);
        const nextDay = date.getDate();
        const nextMonth = date.getMonth() + 1;
        const nextYear = date.getFullYear();
        return `${nextDay}/${nextMonth}/${nextYear}`;
    }

    function convertToUTC(dateString, timeString) {
        const [day, month, year] = dateString.split('/').map(Number);
        const [hours, minutes] = timeString.split(':').map(Number);
        const localDateTime = new Date(Date.UTC(year, month - 1, day, hours - 7, minutes));

        if (isNaN(localDateTime.getTime())) {
            throw new Error("Invalid date or time value");
        }

        const utcDateTime = localDateTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

        return utcDateTime;
    }

    function parseScheduleData() {
        const schedule = [];

        const tkbTuans = document.querySelectorAll('.hitec-td-tkbTuan');

        const startDate = [];
        const endDate = [];

        tkbTuans.forEach(tkbTuan => {
            const text = tkbTuan.innerText;
            const st = text.match(/Từ ngày: (\d{2}\/\d{2}\/\d{4})/)[1];
            const en = text.match(/đến ngày (\d{2}\/\d{2}\/\d{4})/)[1];

            startDate.push(st);
            endDate.push(en);
        });

        const tkbSangs = document.querySelectorAll('.hitec-td-tkbSang');
        const tkbChieus = document.querySelectorAll('.hitec-td-tkbChieu');
        const tkbTois = document.querySelectorAll('.hitec-td-tkbToi');

        tkbSangs.forEach((tkbSang, index) => {
            const data = tkbSang.innerHTML;
            if (data.trim() === '') {
                return;
            }

            let id = 0;

            if (index % 7 === 0)
                id = Math.ceil(index / 7) + 1;
            else
                id = Math.ceil(index / 7);

            const nDay = nextDay(startDate[id - 1], index % 7);

            const className = data.match(/data-original-title="(.*?)\s-\sNhóm\s\d{1,}"/)[1];
            const room = data.match(/Phòng học:\s(.*?)<br\s\/>/)[1];
            const startTime = convertToUTC(nDay, convertStartTime(data.match(/Tiết: (\d{1,2})/)[1]));
            const endTime = convertToUTC(nDay, convertEndTime(data.match(/Tiết: \d{1,2} - (\d{1,2})/)[1]));
            console.log(className, id, index, nDay);
            schedule.push({ className, room, startTime, endTime });
        });

        tkbChieus.forEach((tkbChieu, index) => {
            const data = tkbChieu.innerHTML;
            if (data.trim() === '') {
                return;
            }

            let id = 0;

            if (index % 7 === 0)
                id = Math.ceil(index / 7) + 1;
            else
                id = Math.ceil(index / 7);

            const nDay = nextDay(startDate[id - 1], index % 7);

            const className = data.match(/data-original-title="(.*?)\s-\sNhóm\s\d{1,}"/)[1];
            const room = data.match(/Phòng học:\s(.*?)<br\s\/>/)[1];
            const startTime = convertToUTC(nDay, convertStartTime(data.match(/Tiết: (\d{1,2})/)[1]));
            const endTime = convertToUTC(nDay, convertEndTime(data.match(/Tiết: \d{1,2} - (\d{1,2})/)[1]));

            schedule.push({ className, room, startTime, endTime });
        });

        tkbTois.forEach((tkbToi, index) => {
            const data = tkbToi.innerHTML;
            if (data.trim() === '') {
                return;
            }

            let id = 0;

            if (index % 7 === 0)
                id = Math.ceil(index / 7) + 1;
            else
                id = Math.ceil(index / 7);

            const nDay = nextDay(startDate[id - 1], index % 7);

            const className = data.match(/data-original-title="(.*?)\s-\sNhóm\s\d{1,}"/)[1];
            const room = data.match(/Phòng học:\s(.*?)<br\s\/>/)[1];
            const startTime = convertToUTC(nDay, convertStartTime(data.match(/Tiết: (\d{1,2})/)[1]));
            const endTime = convertToUTC(nDay, convertEndTime(data.match(/Tiết: \d{1,2} - (\d{1,2})/)[1]));

            schedule.push({ className, room, startTime, endTime });
        });

        return schedule;
    }

    function createICS(schedule) {
        let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nCALSCALE:GREGORIAN\nBEGIN:VTIMEZONE\nTZID:Asia/Ho_Chi_Minh\nX-LIC-LOCATION:Asia/Ho_Chi_Minh\nBEGIN:STANDARD\nTZOFFSETFROM:+0700\nTZOFFSETTO:+0700\nTZNAME:GMT+7\nDTSTART:19700101T000000\nEND:STANDARD\nEND:VTIMEZONE\n';

        schedule.forEach(event => {
            icsContent += 'BEGIN:VEVENT\n';
            icsContent += `SUMMARY:${event.className}\n`;
            icsContent += `DTSTART:${event.startTime}Z\n`;
            icsContent += `DTEND:${event.endTime}Z\n`;
            icsContent += `LOCATION:${event.room}\n`;
            icsContent += 'END:VEVENT\n';
        });

        icsContent += 'END:VCALENDAR';
        return icsContent;
    }

    const schedule = parseScheduleData();

    schedule.sort((a, b) => a.className.localeCompare(b.className));

    if (schedule.length === 0) {
        alert('No classes found in the timetable.');
        return;
    }

    const icsContent = createICS(schedule);

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${nameFile}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Create button 'Export to ICS'
const style = document.createElement("style");
style.innerHTML = `
    .btn-export {
        width: 50px; 
        height: 50px;
        padding: 10px;
        display: flex;
        justify-content: center;
        align-items: center;
        transition: width 0.3s ease-in-out, padding 0.3s ease-in-out;
        white-space: nowrap; 
    }

    .btn-export:hover {
        width: 180px; 
        padding: 10px 15px;
    }

    .btn-export span {
        display: none; 
    }

    .btn-export:hover span {
        display: inline; 
    }

    .btn-export:hover svg {
        display: none;    
    }
`;

document.head.appendChild(style);

const button = document.createElement("button");
button.classList.add("btn-export");

button.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-download" viewBox="0 0 16 16">
        <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"/>
        <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708z"/>
    </svg>
    <span>Export to ICS</span>
`;

button.style.position = "fixed";
button.style.top = "50%";
button.style.right = "0px";
button.style.transform = "translateY(-50%)";
button.style.overflow = "hidden";
button.style.background = "#007bff";
button.style.color = "white";
button.style.border = "none";
button.style.borderRadius = "5px 0 0 5px";
button.style.cursor = "pointer";
button.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
button.style.zIndex = "9999";
button.style.fontSize = "16px";

button.style.display = "flex";
button.style.alignItems = "center";
button.style.justifyContent = "center";

document.body.appendChild(button);

button.addEventListener("click", exportToICS);