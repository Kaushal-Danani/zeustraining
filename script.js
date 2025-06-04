function validateForm(event)
{
    event.preventDefault();
    const name = document.getElementById('name').value.trim();
    const comments = document.getElementById('comments').value.trim();
    const maleChecked = document.getElementById('male');
    const femaleChecked = document.getElementById('female');

    if (name == '') {
        alert('Please enter your name.');
        return false;
    }

    if (comments == '') {
        alert('Please enter your comments.');
        return false;
    }

    if (!maleChecked.checked && !femaleChecked.checked) {
        alert('Please select your gender.');
        return false;
    }
    
    return true;
}