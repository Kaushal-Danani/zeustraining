import { Announcement } from './models/announcement.model';
import { Notification } from './models/notification.model';
import { Course } from './models/course.model';

// Script for Login page
const pwdIcon = document.getElementById("password-icon") as HTMLDivElement;
if (pwdIcon) {
    pwdIcon.addEventListener("click", () => {
        const passwordInput = document.getElementById("password") as HTMLInputElement;
    
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            pwdIcon.classList.remove("show-password");
            pwdIcon.classList.add("hide-password");
        } else {
            passwordInput.type = "password";
            pwdIcon.classList.remove("hide-password");
            pwdIcon.classList.add("show-password");
        }
    });
}

// Script for Dashboard page
function fetchAllData(): void {
    fetch('./json/announcement.json')
        .then((response: Response) => response.json())
        .then((data: Announcement[]) => {
            addAnnouncement(data);
        })
        .catch((error: Error) => console.error('Error fetching announcement JSON:', error));

    fetch('./json/notifications.json')
        .then((response: Response) => response.json())
        .then((data: Notification[]) => {
            addNotifications(data);
        })
        .catch((error: Error) => console.error('Error fetching notification JSON:', error));

    fetch('./json/courses.json')
        .then((response: Response) => response.json())
        .then((data: Course[]) => {
            addCourses(data);
        })
        .catch((error: Error) => console.error('Error fetching course JSON:', error));
}

fetchAllData();

function addAnnouncement(announcementData: Announcement[]): void {
    const announcementRecord = announcementData.map((announcement: Announcement) => {
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
        </li>`;
    }).join('');

    const announcementBlocks = document.querySelector('.announcements-blocks') as HTMLElement;
    announcementBlocks.innerHTML = announcementRecord;
}

function addNotifications(notificationData: Notification[]): void {
    const notificationRecord = notificationData.map((notification: Notification) => {
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
        </li>`;
    }).join('');

    const notificationBlocks = document.querySelector('.notifications-blocks') as HTMLElement;
    notificationBlocks.innerHTML = notificationRecord;
}

function addCourses(courseData: Course[]): void {
    const coursesRecord = courseData.map((course: Course) => {
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
                        <select class="teacher-select" ${course.teacherClasses[0] === "No Classes" ? `id="no-classes"` : ``}>
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
        </div>`;
    }).join('');

    const coursesContainer = document.querySelector('.courses-container') as HTMLElement;
    coursesContainer.innerHTML = coursesRecord;
}

function showHoverMenu(id: string): void {
    const element = document.getElementById(id);
    if (element) {
        element.style.display = 'flex';
    }
}

function hideHoverMenu(id: string): void {
    const element = document.getElementById(id);
    if (element) {
        element.style.display = 'none';
    }
}

function showSubMenu(id: string): void {
    const menu = document.querySelector(id) as HTMLElement;
    const subMenu: NodeListOf<HTMLElement> = menu.querySelectorAll('.expanded-menu-options');
    const liComponent = menu.querySelectorAll('.nav-dropdown');
    const arrowImg = liComponent[0].querySelector('.expand-collepse-arrow') as HTMLImageElement;

    if (subMenu[0].style.display === 'flex') {
        subMenu[0].style.display = 'none';
        arrowImg.src = './icons/expand.svg';
        menu.style.backgroundColor = '#fff';
    } else {
        subMenu[0].style.display = 'flex';
        arrowImg.src = './icons/collapse.svg';
        menu.style.backgroundColor = '#F3F3F3';
    }
}

function hideHoverMenuByDelay(id: string, li_id: string, svg_id: string, badge_id: string): void {
    const container = document.getElementById(id);
    const liIcon = document.getElementById(li_id);
    if (container && liIcon) {
        setTimeout(() => {
            if (!container.matches(':hover') && !liIcon.matches(':hover')) {
                container.style.maxHeight = '0px';
                const svg = document.getElementById(svg_id) as HTMLElement;
                if (svg) {
                    svg.style.fill = '#3FD28B';
                }
                const badge = document.getElementById(badge_id);
                if (badge) {
                    badge.style.display = 'flex';
                }
            }
        }, 300);
    }
}

function hideHoverMenuWithIconChange(id: string, svg_id: string, badge_id: string): void {
    const element = document.getElementById(id) as HTMLElement;
    if (element) {
        element.style.maxHeight = '0px';
    }

    const svg = document.getElementById(svg_id) as HTMLElement;
    if (svg) {
        svg.style.fill = '#3FD28B';
    }

    const badge = document.getElementById(badge_id) as HTMLElement;
    if (badge) {
        badge.style.display = 'flex';
    }
}

function showHoverMenuWithchangeIcon(id: string, svg_id: string, badge_id: string): void {
    const element = document.getElementById(id);
    if (element) {
        element.style.maxHeight = '582px';
    }

    const svg = document.getElementById(svg_id) as HTMLElement;
    if (svg) {
        svg.style.fill = '#fff';
    }

    const badge = document.getElementById(badge_id);
    if (badge) {
        badge.style.display = 'none';
    }
}

const notificationIcon = document.getElementById("notification") as HTMLElement;
if (notificationIcon)
{
    notificationIcon.addEventListener("mouseenter", () => {
        showHoverMenuWithchangeIcon('notification-containner', 'Path_3675', 'notification-badge');
    });
    notificationIcon.addEventListener("mouseover", () => {
        showHoverMenuWithchangeIcon('notification-containner', 'Path_3675', 'notification-badge');
    });
    notificationIcon.addEventListener("mouseout", () => {
        hideHoverMenuByDelay('notification-containner', 'notification','Path_3675', 'notification-badge');
    });
}

const notificationContainer = document.getElementById("notification-containner") as HTMLElement;
if (notificationContainer)
{
    notificationContainer.addEventListener("mouseenter", () => {
        showHoverMenuWithchangeIcon('notification-containner', 'Path_3675', 'notification-badge');
    });
    notificationContainer.addEventListener("mouseover", () => {
        showHoverMenuWithchangeIcon('notification-containner', 'Path_3675', 'notification-badge');
    });
    notificationContainer.addEventListener("mouseout", () => {
        hideHoverMenuWithIconChange('notification-containner', 'Path_3675', 'notification-badge');
    });
}


const announcementIcon = document.getElementById("announcement") as HTMLElement;
if(announcementIcon)
{
    announcementIcon.addEventListener("mouseenter", () => {
        showHoverMenuWithchangeIcon('announcements-containner', 'announcement-svg-path', 'announcement-badge');
    });
    announcementIcon.addEventListener("mouseover", () => {
        showHoverMenuWithchangeIcon('announcements-containner', 'announcement-svg-path', 'announcement-badge');
    });
    announcementIcon.addEventListener("mouseout", () => {
        hideHoverMenuByDelay('announcements-containner', 'announcement','announcement-svg-path', 'announcement-badge');
    });
}

const announcementContainer = document.getElementById("announcements-containner") as HTMLElement;
if(announcementContainer)
{
    announcementContainer.addEventListener("mouseenter", () => {
        showHoverMenuWithchangeIcon('announcements-containner', 'announcement-svg-path', 'announcement-badge');
    });
    announcementContainer.addEventListener("mouseover", () => {
        showHoverMenuWithchangeIcon('announcements-containner', 'announcement-svg-path', 'announcement-badge');
    });
    announcementContainer.addEventListener("mouseout", () => {
        hideHoverMenuWithIconChange('announcements-containner', 'announcement-svg-path', 'announcement-badge');
    });
}

const hamburgerMenu = document.getElementById("hamburger-mobile") as HTMLElement;
if (hamburgerMenu)
{
    hamburgerMenu.addEventListener("mouseenter", () => {
        showHoverMenu('mobile-navbar');
    });
    hamburgerMenu.addEventListener("mouseover", () => {
        showHoverMenu('mobile-navbar');
    });
    hamburgerMenu.addEventListener("mouseout", () => {
        hideHoverMenu('mobile-navbar');
    });
}

const mobileNavbar = document.getElementById("mobile-navbar") as HTMLElement;
if (mobileNavbar)
{
    mobileNavbar.addEventListener("mouseenter", () => {
        showHoverMenu('mobile-navbar');
    });
    mobileNavbar.addEventListener("mouseover", () => {
        showHoverMenu('mobile-navbar');
    });
    mobileNavbar.addEventListener("mouseout", () => {
        hideHoverMenu('mobile-navbar');
    });
}

document.getElementById("content-compact").addEventListener("click", () => {
    showSubMenu('#content-compact');
});
document.getElementById("users-compact").addEventListener("click", () => {
    showSubMenu('#users-compact');
});
document.getElementById("reports-compact").addEventListener("click", () => {
    showSubMenu('#reports-compact');
});
document.getElementById("admin-compact").addEventListener("click", () => {
    showSubMenu('#admin-compact');
});