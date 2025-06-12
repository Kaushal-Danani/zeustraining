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