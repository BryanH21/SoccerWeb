document.addEventListener("DOMContentLoaded", function () {
    const currentMonthYear = document.getElementById("current-month-year");
    const calendarDates = document.getElementById("calendar-dates");
    const prevMonthBtn = document.getElementById("prev-month");
    const nextMonthBtn = document.getElementById("next-month");

    let today = new Date();
    let currentMonth = today.getMonth();
    let currentYear = today.getFullYear();

    function generateCalendar(month, year) {
        calendarDates.innerHTML = ""; 
        currentMonthYear.textContent = `${getMonthName(month)} ${year}`;

        let firstDay = new Date(year, month, 1).getDay();
        let daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < firstDay; i++) {
            let emptyCell = document.createElement("div");
            emptyCell.classList.add("empty");
            calendarDates.appendChild(emptyCell);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            let dateCell = document.createElement("div");
            dateCell.classList.add("date");
            dateCell.textContent = day;

            let eventList = document.createElement("div");
            eventList.classList.add("event-list");
            dateCell.appendChild(eventList);

            // Highlight today's date
            if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
                dateCell.classList.add("today");
            }

            calendarDates.appendChild(dateCell);
        }

        // Load pre-set training events
        loadEvents();
    }

    function getMonthName(month) {
        return ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][month];
    }

    prevMonthBtn.addEventListener("click", () => {
        if (currentMonth === 0) {
            currentMonth = 11;
            currentYear--;
        } else {
            currentMonth--;
        }
        generateCalendar(currentMonth, currentYear);
    });

    nextMonthBtn.addEventListener("click", () => {
        if (currentMonth === 11) {
            currentMonth = 0;
            currentYear++;
        } else {
            currentMonth++;
        }
        generateCalendar(currentMonth, currentYear);
    });

    function addEvent(monthIndex, day, text) {
        const eventDiv = document.createElement("div");
        eventDiv.classList.add("event");
        eventDiv.textContent = text;

        const days = document.querySelectorAll("#calendar-dates .date");
        days.forEach(d => {
            if (parseInt(d.textContent) === day) {
                d.appendChild(eventDiv);
            }
        });
    }

    function loadEvents() {
        // Add training sessions (modify these as needed)
        addEvent(3, 10, "Training - 6:00 PM - Field A"); // April 10
        addEvent(5, 5, "Training - 5:30 PM - Field A"); // June 5
        addEvent(7, 15, "Training - 4:00 PM - Field B"); // August 15
    }

    generateCalendar(currentMonth, currentYear);
});