export class ParentDiv {
    parent: HTMLDivElement;
    constructor(color: string, width: string, height: string) {
        this.parent = document.createElement('div');
        this.parent.style.height = height;
        this.parent.style.width = width;
        this.parent.style.position = 'relative';
        this.parent.style.touchAction = 'none';
        this.parent.style.backgroundColor = color;
        document.body.appendChild(this.parent);

        window.addEventListener('resize', () => this.onResize());
    }

    onResize = () => {
        this.parent.style.width = '100%';
        this.parent.style.height = '100%';
    }
}