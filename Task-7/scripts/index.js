import { ParentDiv } from './ParentDiv.js';
import { ChildDiv } from './ChildDiv.js';
document.addEventListener("DOMContentLoaded", () => {
    document.body.style.margin = '0px';
    document.body.style.height = '100%';
    document.body.style.boxSizing = 'border-box';
    document.body.style.display = 'grid';
    document.body.style.gridTemplateColumns = "repeat(auto-fit, minmax(40%, 1fr))";
    document.body.style.gap = '2px';
    document.body.style.touchAction = 'none';
    document.body.style.overflow = 'hidden';
    const parent = new ParentDiv('#4287f5', '100%', '100%');
    const child = new ChildDiv(parent, 50, '#000000');
    const parent2 = new ParentDiv('#44c9eb', '100%', '100%');
    const child2 = new ChildDiv(parent2, 50, '#000000');
    const parent3 = new ParentDiv('#eb7044', '100%', '100%');
    const child3 = new ChildDiv(parent3, 50, '#000000');
    const parent4 = new ParentDiv('#fa9052', '100%', '100%');
    const child4 = new ChildDiv(parent4, 50, '#000000');
});
//# sourceMappingURL=index.js.map