let isPointerDown: boolean = false;
let offsetX: number = 0, offsetY: number = 0;
let dragStartX: number = 0, dragStartY: number = 0;
const draggableBox = document.getElementById("draggable-box") as HTMLDivElement;
const container1 = document.getElementById("container1") as HTMLDivElement;
const container2 = document.getElementById("container2") as HTMLDivElement;

if ( draggableBox )
{
    draggableBox.addEventListener("pointerdown", ( event: DragEvent ) => {
        isPointerDown = true;
        offsetX = event.clientX - draggableBox.offsetLeft;
        offsetY = event.clientY - draggableBox.offsetTop;
        dragStartX = draggableBox.offsetLeft;
        dragStartY = draggableBox.offsetTop;
        draggableBox.style.cursor = "grabbing";
        console.log("Drag started, Offset X:", draggableBox.offsetLeft);
    });
}

document.addEventListener("pointermove", ( event: DragEvent ) => {
    if ( !isPointerDown )
    {
        return;
    }

    let newLeft: number = event.clientX - offsetX;
    let newTop: number = event.clientY - offsetY;
    console.log("Pointer move, Height:", draggableBox.offsetHeight, "Width:", draggableBox.offsetWidth);
    newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - draggableBox.offsetWidth));
    newTop = Math.max(0, Math.min(newTop, window.innerHeight - draggableBox.offsetHeight));

    draggableBox.style.top = `${newTop}px`;
    draggableBox.style.left = `${newLeft}px`;
});

document.addEventListener("pointerup", () => {
    isPointerDown = false;
    draggableBox.style.cursor = "grab";
    // console.log("Current Position:", draggableBox.offsetLeft, draggableBox.offsetTop);

    if ( draggableBox.offsetLeft > container1.offsetLeft && draggableBox.offsetLeft + draggableBox.offsetWidth < container1.offsetLeft + container1.offsetWidth ) {

        if ( container1.offsetTop < draggableBox.offsetTop && draggableBox.offsetTop + draggableBox.offsetHeight < container1.offsetTop + container1.offsetHeight ) 
        {
            dragStartX = draggableBox.offsetLeft;
            dragStartY = draggableBox.offsetTop;
        }
        else 
        {
            draggableBox.style.left = `${dragStartX}px`;
            draggableBox.style.top = `${dragStartY}px`;
            console.log("Drag cancelled, reset position to start");
        }
    }
    else if ( draggableBox.offsetLeft > container2.offsetLeft && draggableBox.offsetLeft + draggableBox.offsetWidth < container2.offsetLeft + container2.offsetWidth )
    {

        if ( container2.offsetTop < draggableBox.offsetTop && draggableBox.offsetTop + draggableBox.offsetHeight < container2.offsetTop + container2.offsetHeight ) 
        {
            dragStartX = draggableBox.offsetLeft;
            dragStartY = draggableBox.offsetTop;
        }
        else
        {
            draggableBox.style.left = `${dragStartX}px`;
            draggableBox.style.top = `${dragStartY}px`;
            console.log("Drag cancelled, reset position to start");
        }
    }
    else
    {
        draggableBox.style.left = `${dragStartX}px`;
        draggableBox.style.top = `${dragStartY}px`;
        console.log("Drag cancelled, reset position to start");
    }
});