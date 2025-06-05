function validateForm(event)
{
    event.preventDefault();
    const name = document.getElementById('name').value.trim();
    const comments = document.getElementById('comments').value.trim();
    const maleChecked = document.getElementById('male');
    const femaleChecked = document.getElementById('female');

    if (name == '') {
        alert('Please enter your name.');
        document.getElementById('name').focus();
        return false;
    }

    if (comments == '') {
        alert('Please enter your comments.');
        document.getElementById('comments').focus();
        return false;
    }

    if (!maleChecked.checked && !femaleChecked.checked) {
        alert('Please select your gender.');
        document.getElementById('gender').style.border = "1px solid red";
        return false;
    }
    
    alert('Form successfully submitted')
    document.getElementById('gender').style.border = "none";
    document.getElementById('myform').reset();
    return true;
}