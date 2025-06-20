(function fetchAllData() {
    fetch('./json/announcement.json')
    .then(response => response.json())
    .then(data => {
        addAnnouncement(data);
    })
    .catch(error => console.error('Error fetching announcement JSON:', error));

    fetch('./json/notifications.json')
    .then(response => response.json())
    .then(data => {
        addNotifications(data);
    })
    .catch(error => console.error('Error fetching notification JSON:', error));

    fetch('./json/courses.json')
    .then(response => response.json())
    .then(data => {
        addCourses(data);
    })
    .catch(error => console.error('Error fetching notification JSON:', error));
})();

function addAnnouncement(announcementData) {
    const announcementRecord = announcementData.map(announcement => { 
        return `
        <li class="single-announcement ${announcement.diffrentBackground ? `removed-background` : ``}">
                <div class="notification-box">
                    <div class="from-person-container">
                        <p>PA: <span>${announcement.senderName}</span></p>
                        <img height="20px" src="./icons/${announcement.operation}" alt="Check Announcement">
                    </div>
                    <p class="announcement-details">${announcement.information}</p>
                    ${announcement.course ? 
                        `<p class="course-details">Course: <span>${announcement.course}</span></p>` : ``}
                    <div class="connected-information">
                        ${announcement.attechedFileInfo ? 
                            `<div class="attached-file-info">
                                <img width="15px" height="15px" src="./icons/attachment.svg" alt="File attached">
                                <p>${announcement.attechedFileInfo}</p>
                            </div>`: ''}
                        <time>${announcement.date} at ${announcement.time}</time>
                    </div>
                </div>
                <div class="horizontal-separation"></div>
        </li>`}).join('');

    const announcementBlocks = document.querySelector('.announcements-blocks');
    announcementBlocks.innerHTML = announcementRecord;
};

function addNotifications(notificationData) {
    const notificationRecord = notificationData.map(notification => { 
        return `
        <li class="single-notification ${notification.diffrentBackground ? `removed-background` : ``}">
                <div class="notification-box">
                    <div class="notification-details">
                        <p>${notification.content}</p>
                        <img height="20px" src="./icons/${notification.operation}" alt="Check notification">
                    </div>
                    ${notification.course ? 
                        `<p class="course-details">Course: <span>${notification.course}</span></p>` : ``}
                    <div class="connected-information">
                        <time>${notification.date} at ${notification.time}</time>
                    </div>
                </div>
                <div class="horizontal-separation"></div>
        </li>`}).join('');

    const notificationBlocks = document.querySelector('.notifications-blocks');
    notificationBlocks.innerHTML = notificationRecord;
};

function addCourses(courseData) {
    const coursesRecord = courseData.map(course => {
        const expiredClass = course.expired ? 'expired-course' : '';
        const expiredTag = course.expired ? '<div class="expired-tag">EXPIRED</div>' : '';

        return `
        <div class="course-card ${expiredClass}">
            ${expiredTag}
            <div class="course-information">
                <div>
                    <img src="${course.image}" alt="Course Image">
                </div>
                <div class="course-details">
                    <div class="title">
                        <h4>${course.title}</h4>
                        <img width="20px" height="24px" src="${course.favouriteIcon}" alt="Favourite Course">
                    </div>
                    <div class="related-subject">
                        ${course.subject}
                        <div class="separation"></div>
                        Grade: ${course.grade}<span>+${course.additionalGrade}</span>
                    </div>
                    ${course.units && course.lessons && course.topics ?
                    `<div class="units-lessons-topics">
                        <div> <strong>${course.units}</strong> Units </div>
                        <div> <strong>${course.lessons}</strong> Lessons </div>
                        <div> <strong>${course.topics}</strong> Topics </div>
                    </div>` : '' }
                    <div>
                        <select class="teacher-select" ${course.teacherClasses.includes("No Classes") ? `id="no-classes"` : ``}>
                            ${course.teacherClasses.map(teacherClass => 
                                `<option value="${teacherClass}">${teacherClass}</option>`).join('')}
                        </select>
                    </div>
                    <div class="enrollment-details">
                        ${course.enrollStudents ?
                        `<div>
                            <span>${course.enrollStudents}</span> Students
                        </div>`
                        : ''}
                        ${course.startDate && course.endDate ?
                        `<div class="vertical-separation"></div>
                        <div>
                            ${course.startDate} - ${course.endDate}
                        </div>` : ''}
                    </div>
                </div>
            </div>
            <div class="course-action-options">
                <img ${course.icons.preview ? `` : `class="disable"`} src="./icons/preview.svg" alt="Preview Course">
                <img ${course.icons.manageCourse ? `` : `class="disable"`} src="./icons/manage course.svg" alt="Manage Course">
                <img ${course.icons.gradeSubmission ? `` : `class="disable"`} src="./icons/grade submissions.svg" alt="Grade Submissions">
                <img ${course.icons.reports ? `` : `class="disable"`} src="./icons/reports.svg" alt="Reports">
            </div>
        </div>
        `;
    }).join('');

    const coursesContainer = document.querySelector('.courses-container');
    coursesContainer.innerHTML = coursesRecord;
}

function showHoverMenu(id) { 
    document.getElementById(id).style.display = 'flex';
}

function hideHoverMenu(id) { 
    document.getElementById(id).style.display = 'none';
}

function showSubMenu(id) {
    const menu = document.querySelector(id);
    const subMenu = menu.querySelectorAll('.expanded-menu-options');
    const liComponent = menu.querySelectorAll('.nav-dropdown');
    const arrowImg = liComponent[0].querySelector('.expand-collepse-arrow');

    if(subMenu[0].style.display === 'flex') {
        subMenu[0].style.display = 'none';
        arrowImg.src = './icons/expand.svg';
        menu.style.backgroundColor = '#fff';
    }
    else {
        subMenu[0].style.display = 'flex'
        arrowImg.src = './icons/collapse.svg';
        menu.style.backgroundColor = '#F3F3F3';
    }
}

function hideHoverMenuByDelay(id, li_id, svg_id, badge_id) {
    const container = document.getElementById(id);
    const liIcon = document.getElementById(li_id);
    setTimeout(() => {
        if(!container.matches(':hover') && !liIcon.matches(':hover'))
        {
            container.style.maxHeight = '0px';
            const svg = document.getElementById(svg_id);
            svg.style.fill = '#3FD28B';
            document.getElementById(badge_id).style.display = 'flex';
        }
    }, 300);
}

function hideHoverMenuWithIconChange(id, svg_id, badge_id) {
    document.getElementById(id).style.maxHeight = '0px';
    const svg = document.getElementById(svg_id);
    svg.style.fill = '#3FD28B';
    document.getElementById(badge_id).style.display = 'flex';
}

function showHoverMenuWithchangeIcon(id, svg_id, badge_id) {
    document.getElementById(id).style.maxHeight = '582px';
    const svg = document.getElementById(svg_id);
    svg.style.fill = '#fff';
    document.getElementById(badge_id).style.display = 'none';
}