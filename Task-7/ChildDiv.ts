import { ParentDiv } from "./ParentDiv";

export class ChildDiv {
    child: HTMLDivElement;
    parent: ParentDiv;
    offsetX = 0;
    offsetY = 0;
    size = 0;
    isDraggable = false;

    constructor(parent: ParentDiv, size: number, color: string) {
        this.parent = parent;
        this.size = size;
        this.child = document.createElement('div');
        this.child.style.height = `${size}px`;
        this.child.style.width = `${size}px`;
        this.child.style.position = 'absolute';
        this.child.style.cursor = 'grab';
        this.child.style.backgroundColor = color;
        parent.parent.appendChild(this.child);

        this.child.addEventListener('pointerdown', this.onPointerDown.bind(this));
        this.child.addEventListener('pointermove', this.onPointerMove.bind(this));
        this.child.addEventListener('pointerup', this.onPointerUp.bind(this));
        this.child.addEventListener('pointercancel', this.onPointerUp.bind(this));

        window.addEventListener('resize', () => this.clampPosition());
    }

    onPointerDown = (event: PointerEvent) => {
        this.isDraggable = true;
        this.child.style.cursor = 'grabbing';
        const rect = this.child.getBoundingClientRect();
        const parentRect = this.parent.parent.getBoundingClientRect();
        this.offsetX = event.clientX - (rect.left - parentRect.left);
        this.offsetY = event.clientY - (rect.top - parentRect.top);
        this.child.setPointerCapture(event.pointerId);
    }

    onPointerMove = (event: PointerEvent) => {
        if (!this.isDraggable) 
            return;

        const parentSize = this.parent.parent.getBoundingClientRect();
        let newLeft = event.clientX - this.offsetX;
        let newTop = event.clientY - this.offsetY;

        newLeft = Math.max(0, Math.min(newLeft, parentSize.width - this.size));
        newTop = Math.max(0, Math.min(newTop, parentSize.height - this.size));

        this.child.style.left = `${newLeft}px`;
        this.child.style.top = `${newTop}px`;
    }

    onPointerUp = (event: PointerEvent) => {
        this.isDraggable = false;
        this.child.style.cursor = 'grab';
        this.child.releasePointerCapture(event.pointerId);
    }

    clampPosition = () => {
        const parentSize = this.parent.parent.getBoundingClientRect(); 
        let left = parseInt(this.child.style.left, 10) || 0;
        let top = parseInt(this.child.style.top, 10) || 0;

        left = Math.max(0, Math.min(left, parentSize.width - this.size));
        top = Math.max(0, Math.min(top, parentSize.height - this.size));

        this.child.style.left = `${left}px`;
        this.child.style.top = `${top}px`;
    }

}