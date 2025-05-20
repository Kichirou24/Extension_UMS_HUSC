// --- ICS Export Utility ---
function exportToICS() {
    // --- Helper: Convert period to time ---
    const periodMap = {
        start: { "0": "00:00", "1": "07:00", "2": "08:00", "3": "09:00", "4": "10:00", "5": "13:00", "6": "14:00", "7": "15:00", "8": "16:00", "9": "17:30", "10": "18:30", "11": "19:30", "12": "20:30" },
        end:   { "0": "00:00", "1": "07:50", "2": "08:50", "3": "09:50", "4": "10:50", "5": "13:50", "6": "14:50", "7": "15:50", "8": "16:50", "9": "18:15", "10": "19:15", "11": "20:15", "12": "21:15" }
    };
    const convertTime = (period, type) => periodMap[type][period];

    // --- Helper: Next day calculation ---
    const nextDay = (day, offset) => {
        const [d, m, y] = day.split('/').map(Number);
        const date = new Date(y, m - 1, d + offset);
        return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    };

    // --- Helper: Convert to UTC string for ICS ---
    const toUTC = (dateStr, timeStr) => {
        const [d, m, y] = dateStr.split('/').map(Number);
        const [h, min] = timeStr.split(':').map(Number);
        const dt = new Date(Date.UTC(y, m - 1, d, h - 7, min));
        if (isNaN(dt.getTime())) throw new Error("Invalid date/time");
        return dt.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    // --- Parse all schedule data (sáng, chiều, tối) ---
    function parseSchedule() {
        const schedule = [];
        const startDates = Array.from(document.querySelectorAll('.hitec-td-tkbTuan')).map(t =>
            t.innerText.match(/Từ ngày: (\d{2}\/\d{2}\/\d{4})/)[1]
        );
        ['.hitec-td-tkbSang', '.hitec-td-tkbChieu', '.hitec-td-tkbToi'].forEach(sel => {
            document.querySelectorAll(sel).forEach((cell, idx) => {
                const data = cell.innerHTML;
                if (!data.trim()) return;
                const id = Math.ceil(idx / 7) + (idx % 7 === 0 ? 1 : 0);
                const nDay = nextDay(startDates[id - 1], idx % 7);
                const className = data.match(/data-original-title="(.*?)\s-\sNhóm\s\d{1,}"/)?.[1];
                const room = data.match(/Phòng học:\s(.*?)<br\s\/>/)?.[1];
                const startPeriod = data.match(/Tiết: (\d{1,2})/);
                const endPeriod = data.match(/Tiết: \d{1,2} - (\d{1,2})/);
                if (!className || !room || !startPeriod || !endPeriod) return;
                schedule.push({
                    className,
                    room,
                    startTime: toUTC(nDay, convertTime(startPeriod[1], 'start')),
                    endTime: toUTC(nDay, convertTime(endPeriod[1], 'end'))
                });
            });
        });
        return schedule;
    }

    // --- Create ICS content ---
    function createICS(schedule) {
        return [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'CALSCALE:GREGORIAN',
            'BEGIN:VTIMEZONE',
            'TZID:Asia/Ho_Chi_Minh',
            'X-LIC-LOCATION:Asia/Ho_Chi_Minh',
            'BEGIN:STANDARD',
            'TZOFFSETFROM:+0700',
            'TZOFFSETTO:+0700',
            'TZNAME:GMT+7',
            'DTSTART:19700101T000000',
            'END:STANDARD',
            'END:VTIMEZONE',
            ...schedule.map(ev => [
                'BEGIN:VEVENT',
                `SUMMARY:${ev.className}`,
                `DTSTART:${ev.startTime}Z`,
                `DTEND:${ev.endTime}Z`,
                `LOCATION:${ev.room}`,
                'END:VEVENT'
            ].join('\n')),
            'END:VCALENDAR'
        ].join('\n');
    }

    // --- Main logic ---
    const schedule = parseSchedule().sort((a, b) => a.className.localeCompare(b.className));
    if (!schedule.length) return alert('No classes found in the timetable.');
    const icsContent = createICS(schedule);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- Button UI ---
if (!document.querySelector("style[data-export-ics-btn]")) {
    const style = document.createElement("style");
    style.setAttribute("data-export-ics-btn", "1");
    style.innerHTML = `
        .btn-export-ics {
            width: 50px; height: 50px; padding: 10px;
            display: flex; justify-content: center; align-items: center;
            transition: width 0.3s, padding 0.3s; white-space: nowrap;
        }
        .btn-export-ics:hover { width: 180px; padding: 10px 15px; }
        .btn-export-ics span { display: none; }
        .btn-export-ics:hover span { display: inline; }
        .btn-export-ics:hover svg { display: none; }
    `;
    document.head.appendChild(style);
}

if (!document.querySelector(".btn-export-ics")) {
    const button = document.createElement("button");
    button.classList.add("btn-export-ics");
    button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-download" viewBox="0 0 16 16">
            <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"/>
            <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708z"/>
        </svg>
        <span>Export to ICS</span>
    `;
    Object.assign(button.style, {
        position: "fixed", top: "50%", right: "0px", transform: "translateY(-50%)",
        overflow: "hidden", background: "#007bff", color: "white", border: "none",
        borderRadius: "5px 0 0 5px", cursor: "pointer", boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        zIndex: "9999", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center"
    });
    document.body.appendChild(button);
    button.addEventListener("click", exportToICS);
}