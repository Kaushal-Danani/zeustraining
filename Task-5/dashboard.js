"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Script for Login page
var pwdIcon = document.getElementById("password-icon");
if (pwdIcon) {
    pwdIcon.addEventListener("click", function () {
        var passwordInput = document.getElementById("password");
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            pwdIcon.classList.remove("show-password");
            pwdIcon.classList.add("hide-password");
        }
        else {
            passwordInput.type = "password";
            pwdIcon.classList.remove("hide-password");
            pwdIcon.classList.add("show-password");
        }
    });
}
// Script for Dashboard page
function fetchAllData() {
    fetch('./json/announcement.json')
        .then(function (response) { return response.json(); })
        .then(function (data) {
        addAnnouncement(data);
    })
        .catch(function (error) { return console.error('Error fetching announcement JSON:', error); });
    fetch('./json/notifications.json')
        .then(function (response) { return response.json(); })
        .then(function (data) {
        addNotifications(data);
    })
        .catch(function (error) { return console.error('Error fetching notification JSON:', error); });
    fetch('./json/courses.json')
        .then(function (response) { return response.json(); })
        .then(function (data) {
        addCourses(data);
    })
        .catch(function (error) { return console.error('Error fetching course JSON:', error); });
}
fetchAllData();
function addAnnouncement(announcementData) {
    var announcementRecord = announcementData.map(function (announcement) {
        return "\n        <li class=\"single-announcement ".concat(announcement.diffrentBackground ? "removed-background" : "", "\">\n            <div class=\"notification-box\">\n                <div class=\"from-person-container\">\n                    <p>PA: <span>").concat(announcement.senderName, "</span></p>\n                    <img height=\"20px\" src=\"./icons/").concat(announcement.operation, "\" alt=\"Check Announcement\">\n                </div>\n                <p class=\"announcement-details\">").concat(announcement.information, "</p>\n                ").concat(announcement.course ?
            "<p class=\"course-details\">Course: <span>".concat(announcement.course, "</span></p>") : "", "\n                <div class=\"connected-information\">\n                    ").concat(announcement.attechedFileInfo ?
            "<div class=\"attached-file-info\">\n                            <img width=\"15px\" height=\"15px\" src=\"./icons/attachment.svg\" alt=\"File attached\">\n                            <p>".concat(announcement.attechedFileInfo, "</p>\n                        </div>") : '', "\n                    <time>").concat(announcement.date, " at ").concat(announcement.time, "</time>\n                </div>\n            </div>\n            <div class=\"horizontal-separation\"></div>\n        </li>");
    }).join('');
    var announcementBlocks = document.querySelector('.announcements-blocks');
    announcementBlocks.innerHTML = announcementRecord;
}
function addNotifications(notificationData) {
    var notificationRecord = notificationData.map(function (notification) {
        return "\n        <li class=\"single-notification ".concat(notification.diffrentBackground ? "removed-background" : "", "\">\n            <div class=\"notification-box\">\n                <div class=\"notification-details\">\n                    <p>").concat(notification.content, "</p>\n                    <img height=\"20px\" src=\"./icons/").concat(notification.operation, "\" alt=\"Check notification\">\n                </div>\n                ").concat(notification.course ?
            "<p class=\"course-details\">Course: <span>".concat(notification.course, "</span></p>") : "", "\n                <div class=\"connected-information\">\n                    <time>").concat(notification.date, " at ").concat(notification.time, "</time>\n                </div>\n            </div>\n            <div class=\"horizontal-separation\"></div>\n        </li>");
    }).join('');
    var notificationBlocks = document.querySelector('.notifications-blocks');
    notificationBlocks.innerHTML = notificationRecord;
}
function addCourses(courseData) {
    var coursesRecord = courseData.map(function (course) {
        var expiredClass = course.expired ? 'expired-course' : '';
        var expiredTag = course.expired ? '<div class="expired-tag">EXPIRED</div>' : '';
        return "\n        <div class=\"course-card ".concat(expiredClass, "\">\n            ").concat(expiredTag, "\n            <div class=\"course-information\">\n                <div class=\"image-container\">\n                    <img src=\"").concat(course.image, "\" alt=\"Course Image\">\n                </div>\n                <div class=\"course-details\">\n                    <div class=\"title\">\n                        <h4>").concat(course.title, "</h4>\n                        <img width=\"20px\" height=\"24px\" src=\"").concat(course.favouriteIcon, "\" alt=\"Favourite Course\">\n                    </div>\n                    <div class=\"related-subject\">\n                        ").concat(course.subject, "\n                        <div class=\"separation\"></div>\n                        Grade: ").concat(course.grade, "<span>+").concat(course.additionalGrade, "</span>\n                    </div>\n                    ").concat(course.units && course.lessons && course.topics ?
            "<div class=\"units-lessons-topics\">\n                        <div> <strong>".concat(course.units, "</strong> Units </div>\n                        <div> <strong>").concat(course.lessons, "</strong> Lessons </div>\n                        <div> <strong>").concat(course.topics, "</strong> Topics </div>\n                    </div>") : '', "\n                    <div class=\"teacher-selector\">\n                        <select name=\"teacher\" class=\"teacher-select\" ").concat(course.teacherClasses[0] === "No Classes" ? "id=\"no-classes\"" : "", ">\n                            ").concat(course.teacherClasses.map(function (teacherClass) {
            return "<option value=\"".concat(teacherClass, "\">").concat(teacherClass, "</option>");
        }).join(''), "\n                        </select>\n                    </div>\n                    <div class=\"enrollment-details\">\n                        ").concat(course.enrollStudents ?
            "<div>\n                            <span>".concat(course.enrollStudents, "</span> Students\n                        </div>")
            : '', "\n                        ").concat(course.startDate && course.endDate ?
            "<div class=\"vertical-separation\"></div>\n                        <div>\n                            ".concat(course.startDate, " - ").concat(course.endDate, "\n                        </div>") : '', "\n                    </div>\n                </div>\n            </div>\n            <div class=\"course-action-options\">\n                <img ").concat(course.icons.preview ? "" : "class=\"disable\"", " src=\"./icons/preview.svg\" alt=\"Preview Course\">\n                <img ").concat(course.icons.manageCourse ? "" : "class=\"disable\"", " src=\"./icons/manage course.svg\" alt=\"Manage Course\">\n                <img ").concat(course.icons.gradeSubmission ? "" : "class=\"disable\"", " src=\"./icons/grade submissions.svg\" alt=\"Grade Submissions\">\n                <img ").concat(course.icons.reports ? "" : "class=\"disable\"", " src=\"./icons/reports.svg\" alt=\"Reports\">\n            </div>\n        </div>");
    }).join('');
    var coursesContainer = document.querySelector('.courses-container');
    coursesContainer.innerHTML = coursesRecord;
}
function showHoverMenu(id) {
    var element = document.getElementById(id);
    if (element) {
        element.style.display = 'flex';
    }
}
function hideHoverMenu(id) {
    var element = document.getElementById(id);
    if (element) {
        element.style.display = 'none';
    }
}
function showSubMenu(id) {
    var menu = document.querySelector(id);
    var subMenu = menu.querySelectorAll('.expanded-menu-options');
    var liComponent = menu.querySelectorAll('.nav-dropdown');
    var arrowImg = liComponent[0].querySelector('.expand-collepse-arrow');
    if (subMenu[0].style.display === 'flex') {
        subMenu[0].style.display = 'none';
        arrowImg.src = './icons/expand.svg';
        menu.style.backgroundColor = '#fff';
    }
    else {
        subMenu[0].style.display = 'flex';
        arrowImg.src = './icons/collapse.svg';
        menu.style.backgroundColor = '#F3F3F3';
    }
}
function hideHoverMenuByDelay(id, li_id, svg_id, badge_id) {
    var container = document.getElementById(id);
    var liIcon = document.getElementById(li_id);
    if (container && liIcon) {
        setTimeout(function () {
            if (!container.matches(':hover') && !liIcon.matches(':hover')) {
                container.style.maxHeight = '0px';
                var svg = document.getElementById(svg_id);
                if (svg) {
                    svg.style.fill = '#3FD28B';
                }
                var badge = document.getElementById(badge_id);
                if (badge) {
                    badge.style.display = 'flex';
                }
            }
        }, 300);
    }
}
function hideHoverMenuWithIconChange(id, svg_id, badge_id) {
    var element = document.getElementById(id);
    if (element) {
        element.style.maxHeight = '0px';
    }
    var svg = document.getElementById(svg_id);
    if (svg) {
        svg.style.fill = '#3FD28B';
    }
    var badge = document.getElementById(badge_id);
    if (badge) {
        badge.style.display = 'flex';
    }
}
function showHoverMenuWithchangeIcon(id, svg_id, badge_id) {
    var element = document.getElementById(id);
    if (element) {
        element.style.maxHeight = '582px';
    }
    var svg = document.getElementById(svg_id);
    if (svg) {
        svg.style.fill = '#fff';
    }
    var badge = document.getElementById(badge_id);
    if (badge) {
        badge.style.display = 'none';
    }
}
var notificationIcon = document.getElementById("notification");
if (notificationIcon) {
    notificationIcon.addEventListener("mouseenter", function () {
        showHoverMenuWithchangeIcon('notification-containner', 'Path_3675', 'notification-badge');
    });
    notificationIcon.addEventListener("mouseover", function () {
        showHoverMenuWithchangeIcon('notification-containner', 'Path_3675', 'notification-badge');
    });
    notificationIcon.addEventListener("mouseout", function () {
        hideHoverMenuByDelay('notification-containner', 'notification', 'Path_3675', 'notification-badge');
    });
}
var notificationContainer = document.getElementById("notification-containner");
if (notificationContainer) {
    notificationContainer.addEventListener("mouseenter", function () {
        showHoverMenuWithchangeIcon('notification-containner', 'Path_3675', 'notification-badge');
    });
    notificationContainer.addEventListener("mouseover", function () {
        showHoverMenuWithchangeIcon('notification-containner', 'Path_3675', 'notification-badge');
    });
    notificationContainer.addEventListener("mouseout", function () {
        hideHoverMenuWithIconChange('notification-containner', 'Path_3675', 'notification-badge');
    });
}
var announcementIcon = document.getElementById("announcement");
if (announcementIcon) {
    announcementIcon.addEventListener("mouseenter", function () {
        showHoverMenuWithchangeIcon('announcements-containner', 'announcement-svg-path', 'announcement-badge');
    });
    announcementIcon.addEventListener("mouseover", function () {
        showHoverMenuWithchangeIcon('announcements-containner', 'announcement-svg-path', 'announcement-badge');
    });
    announcementIcon.addEventListener("mouseout", function () {
        hideHoverMenuByDelay('announcements-containner', 'announcement', 'announcement-svg-path', 'announcement-badge');
    });
}
var announcementContainer = document.getElementById("announcements-containner");
if (announcementContainer) {
    announcementContainer.addEventListener("mouseenter", function () {
        showHoverMenuWithchangeIcon('announcements-containner', 'announcement-svg-path', 'announcement-badge');
    });
    announcementContainer.addEventListener("mouseover", function () {
        showHoverMenuWithchangeIcon('announcements-containner', 'announcement-svg-path', 'announcement-badge');
    });
    announcementContainer.addEventListener("mouseout", function () {
        hideHoverMenuWithIconChange('announcements-containner', 'announcement-svg-path', 'announcement-badge');
    });
}
var hamburgerMenu = document.getElementById("hamburger-mobile");
if (hamburgerMenu) {
    hamburgerMenu.addEventListener("mouseenter", function () {
        showHoverMenu('mobile-navbar');
    });
    hamburgerMenu.addEventListener("mouseover", function () {
        showHoverMenu('mobile-navbar');
    });
    hamburgerMenu.addEventListener("mouseout", function () {
        hideHoverMenu('mobile-navbar');
    });
}
var mobileNavbar = document.getElementById("mobile-navbar");
if (mobileNavbar) {
    mobileNavbar.addEventListener("mouseenter", function () {
        showHoverMenu('mobile-navbar');
    });
    mobileNavbar.addEventListener("mouseover", function () {
        showHoverMenu('mobile-navbar');
    });
    mobileNavbar.addEventListener("mouseout", function () {
        hideHoverMenu('mobile-navbar');
    });
}
document.getElementById("content-compact").addEventListener("click", function () {
    showSubMenu('#content-compact');
});
document.getElementById("users-compact").addEventListener("click", function () {
    showSubMenu('#users-compact');
});
document.getElementById("reports-compact").addEventListener("click", function () {
    showSubMenu('#reports-compact');
});
document.getElementById("admin-compact").addEventListener("click", function () {
    showSubMenu('#admin-compact');
});
