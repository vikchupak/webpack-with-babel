//import {listItems, gap, sortables, total} from '@/vars.js';
const container = document.querySelector('#container');

// Changes an elements's position in array
function arrayMove(array, from, to) {
    array.splice(to, 0, array.splice(from, 1)[0]);
}

function changeIndex(item, to) {
    // Change position in array
    arrayMove(sortables, item.index, to);
    // Set index for each sortable
    sortables.forEach((sortable, index) => sortable.setIndex(index));
}

export function Sortable(element, index) {
      
    const content = element.querySelector(".item-content");
    const order   = element.querySelector(".order");
    
    const animation = gsap.to(content, {
      duration: 0.3,
      boxShadow: "rgba(0,0,0,0.2) 0px 16px 32px 0px",
      force3D: true,
      scale: 1.1,
      paused: true
    });

    const [dragger] = Draggable.create(element, {
      onDragStart: downAction,
      onRelease: upAction,
      onDrag: dragAction,
      cursor: "inherit",    
      type: "x,y",
      allowContextMenu: true
    });

    // Public properties and methods
    const sortable = {
      dragger:  dragger,
      element:  element,
      startIndex: null,
      index:    index,
      setIndex: setIndex,
      location: {
        y: null,
        height: null,
        center: null
      }
    };

    setInitHeight();
    function setInitHeight() {
      sortable.location.height = listItems[sortable.index].getBoundingClientRect().height;
    }

    setInitY();
    function setInitY() {
      if (sortable.index === 0) {
        sortable.location.y = 0;
      } else {
        sortable.location.y = sortables[sortable.index - 1].location.y + sortables[sortable.index - 1].location.height + gap;
      }
    }

    setInitCenter();
    function setInitCenter() {
      if (sortable.index === 0) {
        sortable.location.center = sortable.location.height / 2;
      } else {
        sortable.location.center = sortable.location.y + sortable.location.height / 2;
      }
    }
    
    gsap.set(element, {
      x: 0,
      y: sortable.location.y
    });
      
    function setIndex(index) {
      if (sortable.index !== index) {

        sortable.index = index;    
        order.textContent = index + 1;

        //setHeight();
        setY();
        setCenter();
        
        // Don't layout elem if it being dragged
        if (!dragger.isDragging) layout();
      }
    }

    // function setHeight() {
    //   sortable.location.height = sortables[sortable.index].element.getBoundingClientRect().height;
    // }

    function setY() {
      if (sortable.index === 0) {
        sortable.location.y = 0;
      } else {
        sortable.location.y = sortables[sortable.index - 1].location.y + sortables[sortable.index - 1].location.height + gap;
      }
    }

    function setCenter() {
      if (sortable.index === 0) {
        sortable.location.center = sortable.location.height / 2;
      } else {
        sortable.location.center = sortable.location.y + sortable.location.height / 2;
      }
    }
    
    function dragAction() {
      if (sortable.index !== 0) {
        if (this.y < sortables[sortable.index - 1].location.center) {
          changeIndex(sortable, sortable.index - 1);
        }
      }
      if (sortable.index !== total - 1) {
        if (this.y > sortables[sortable.index + 1].location.center - sortable.location.height) {
          changeIndex(sortable, sortable.index + 1);
        }
      }
    }

    function downAction() {
      sortable.startIndex = sortable.index;
      animation.play();
      this.update();
    }
    
    function upAction() {
      //Change element's position in DOM
      if (sortable.index === total - 1) {
        //container.appendChild(sortable.element);
        container.append(sortable.element);
      } else {   
        const i = sortable.startIndex > sortable.index ? sortable.index : sortable.index + 1;
        container.insertBefore(sortable.element, container.children[i]);
      }

      animation.reverse();
      layout();
    }
    
    function layout() {
      //console.log('layout: ', sortable);
      gsap.to(element, {
        duration: 0.3,
        x: 0,
        y: sortable.location.y
      });  
    }
      
    return sortable;
}