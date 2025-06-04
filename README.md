# zeustraining

# Task-1: Web Development Basics: HTML, CSS, JavaScript

## 1. HTML Task

### What is HTML?

**HTML (HyperText Markup Language)** is the standard markup language used to structure content on the web. It defines the layout of a webpage using elements such as headings, paragraphs, links, images, etc.

### Basic Structure of an HTML Page

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Sample Page</title>
</head>
<body>
    <h1>Hello, World!</h1>
</body>
</html>
```

## 2. CSS Task

### Explain the different ways in which CSS can be applied to HTML
There are 3 different ways in which CSS can be applied to HTML.
1. Inline CSS
```html
<p style="color: red;">This is red text.</p>
```

2. Internal CSS
```html
<head>
  <style>
    p {
      color: blue;
    }
  </style>
</head>
```

3. External CSS
```html
<head>
  <link rel="stylesheet" href="style.css">
</head>
```

### what is the preferred way and why?
External CSS is the preferred way beacuse it keeps styling separate from content, makes code reusable across pages and improves maintainability.

### What are different CSS selectors, with example explain Element, Class and Id selectors.
1. Element Selector:
Targets all HTML elements of a specified type.

```CSS
p {
  color: green;
}
```

2. Class Selector:
Targets elements with a specific class name.

```CSS
.intro {
  font-size: 18px;
}
```
```HTML
<p class="intro">This is an intro paragraph.</p>
```

3. ID Selector:
Targets a single unique element with an ID.

```CSS
#main-heading {
  text-align: center;
}
```
```HTML
<h1 id="main-heading">Welcome</h1>
```

## 3. JavaScript Task

1. Inline JavaScript

```HTML
<button onclick="alert('Button clicked!')">Click Me</button>
```

2. Internal JavaScript

```JavaScript
<script>
  alert('Hello from internal JS');
</script>
```

3. External JavaScript – In a separate .js file:

```JavaScript
<script src="script.js"></script>
```

###  what is the preferred way?
External JavaScript is best for keeping logic separate, cleaner code organization, and better performance (caching).
