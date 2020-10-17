'use strict';

import '@/sassstyle.scss';

//************DRAG & DROP START*************************************//

const container = document.querySelector('#container');
const gap       = 10;
const sortables = []; // Array of sortables
let total       = null;

// Changes an elements's position in array
function arrayMove(array, from, to) {
    array.splice(to, 0, array.splice(from, 1)[0]);
}

function changeIndex(item, to) {
    // Change position in array
    arrayMove(sortables, item.index, to);
    // Set index for each sortable
    sortables.forEach((sortable, index) => sortable.setIndexWithDb(index));
}

function createSortable(element, index) {
      
    const content = element.querySelector(".item-content");
    const order   = element.querySelector(".order");
    
    const animation = gsap.to(content, {
      duration: 0.3,
      boxShadow: "rgba(0,0,0,0.2) 0px 16px 32px 0px",
      force3D: true,
      //scale: 1.06,
      paused: true
    });

    const [dragger] = Draggable.create(element, {
      onDragStart: downAction,
      onDrag: dragAction,
      onDragEnd: upAction,
      cursor: "inherit",
      activeCursor: "move",
      bounds: document.querySelector('body'),  
      type: "x,y",
      allowContextMenu: true,
      zIndexBoost: false
    });

    // Public properties and methods
    const sortable = {
      dragger:  dragger,
      element:  element,
      startIndex: null,
      index:    index,
      setIndex: setIndex,
      setIndexWithDb: setIndexWithDb,
      setIndexSearch: setIndexSearch,
      location: {
        y: null,
        height: null,
        center: null
      },
      setLocFunc: {
        setY: setY,
        setHeight: setHeight,
        setCenter: setCenter
      }
    };

    setHeight();
    function setHeight() {
      sortable.location.height = sortable.element.getBoundingClientRect().height;
    }

    gsap.set(element, {//початкове положення новоствореного елемента
      x: 0,
      y: 0
    });
      
    function setIndex(index) {
      if (sortable.index !== index) {

        sortable.index = index;
        order.textContent = `#${index + 1}`;

        setY();
        setCenter();
        
        // Don't layout elem if it being dragged
        if (!dragger.isDragging) layout();
      }
    }

    function setIndexWithDb(index) {
      if (sortable.index !== index) {

        sortable.index = index;
        order.textContent = `#${index + 1}`;

        setY();
        setCenter();

        db.collection("users")
        .doc(auth.currentUser.uid)
        .collection('list')
        .doc(sortable.element.id)
        .update({
          index: index
        })
        
        // Don't layout elem if it being dragged
        if (!dragger.isDragging) layout();
      }
    }

    function setIndexSearch(index) {
      sortable.index = index;
      order.textContent = `#${index + 1}`;

      setY();
      //setCenter();
      layout();
    }


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
      sortable.element.style.zIndex = '1100';
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
      setTimeout(() => {sortable.element.style.zIndex = '1000'}, 500);
      animation.reverse();
      layout();
    }
    
    function layout() {
      //console.log('layout')
      gsap.to(element, {
        duration: 0.3,
        x: 0,
        y: sortable.location.y
      });
    }
      
    return sortable;
}

let width = container.getBoundingClientRect().width;

window.addEventListener("resize", function() {
  setTimeout(function() {
    if (container.getBoundingClientRect().width !== width) {
      width = container.getBoundingClientRect().width;

      //спочатку міняєм текст ареа розмір і тільки потім рахуєм розміри елементів
      document.querySelectorAll('textarea').forEach(function (area) {
        //const offset = area.offsetHeight - area.clientHeight;
        const offset = 1 + 1;
        area.style.height = 'auto';
        area.style.height = area.scrollHeight + offset + 'px';
      })

      setTimeout(resetAllLayout, 50);
    }
  }, 100)
});

function resetAllLayout() {
  sortables.forEach(function(sortable) {
    sortable.setLocFunc.setHeight();
    sortable.setLocFunc.setY();
    sortable.setLocFunc.setCenter();

    if (sortable.index === total - 1) {
      container.style.height = `${sortable.location.y + sortable.location.height + 62}px`;
    }

    gsap.to(sortable.element, {
      duration: 0,
      x: 0,
      y: sortable.location.y
    })

  });
}

//************DRAG & DROP END************************************************//

// listen for auth status changes
auth.onAuthStateChanged(user => {//RENDER ACCORDING TO FIREBASE CHANGES!!!!!
    if (user) {
        console.log('user logged in:\n', user.uid);

        function snapshotCheck(invoctimes) {
          return function() {
            if (invoctimes === 0 || invoctimes === 1) {invoctimes++};
            return invoctimes === 1
          }
        }

        const snapshotInit = snapshotCheck(0);

        //db conversation based on logged in user               //тут сортыровка задатою!!! //list-group-item
        db.collection('users').doc(user.uid).collection('list').orderBy("index", "desc").onSnapshot(snapshot => {

            let initSnap = snapshotInit();

            snapshot.docChanges().forEach(function(change) {
              function formatDate(date) {
                return `${date.getDate()}.${date.getMonth()}.${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
              }

                const liTemplate = () => `
                <div id="${change.doc.id}" class="list-item" data-complete="${change.doc.data().complete}">
                  <div class="item-content">
                    <div class="item-info">
                      <p class="order">#</p>
                      <span>created: ${formatDate(change.doc.data().createdate.toDate())}</span>
                      <div class="to-replace-content">
                        ${change.doc.data().content}
                      </div>
                    </div>
                    <div class="item-action">
                      <button class="complete"><img src="https://img.icons8.com/cute-clipart/32/000000/checkmark.png"/></button>
                      <button class="edit"><img src="https://img.icons8.com/cotton/32/000000/edit--v2.png"/></button>
                      <button class="delete"><img src="https://img.icons8.com/cute-clipart/32/000000/delete-sign.png"/></button>
                    </div>
                  </div>
                </div>`

                if (change.type === "added") {
                  container.insertAdjacentHTML("afterbegin", liTemplate());
                  const item = document.getElementById(change.doc.id);
                  setTimeout(function() {
                    const sortable = createSortable(item, null);
                    sortables.unshift(sortable);
                    total = sortables.length;
                    sortable.element.style.visibility = "visible";
                    if (initSnap) {
                      console.log('initSnap: ', initSnap);
                      sortables.forEach((sortable, index) => {
                        sortable.setIndex(index);
                        if (index === total - 1) {
                          container.style.height = `${sortable.location.y + sortable.location.height + 62}px`;
                        }
                      });
                    } else {
                      console.log('initSnap: ', initSnap);
                      sortables.forEach((sortable, index) => {
                        sortable.setIndexWithDb(index);
                        if (index === total - 1) {
                          container.style.height = `${sortable.location.y + sortable.location.height + 62}px`;
                        }
                      });
                    }
                  }, 0)
                }

                if (change.type === "modified") {
                  const sortable = sortables.find(sortable => sortable.element.id === change.doc.id);

                  if (change.doc.data().complete === 'true') {
                    sortable.element.dataset.complete = 'true'
                  } else {
                    sortable.element.dataset.complete = 'false'
                  }



                  if (sortable.element.querySelector('form')) {
                    const div = sortable.element.querySelector('.to-replace-content');
                    div.innerHTML = `${change.doc.data().content.trim()}`;
  
                    const itemActions = sortable.element.querySelector('.item-action');
                    itemActions.innerHTML = `<button class="complete"><img src="https://img.icons8.com/cute-clipart/32/000000/checkmark.png"/></button><button class="edit"><img src="https://img.icons8.com/cotton/32/000000/edit--v2.png"/></button><button class="delete"><img src="https://img.icons8.com/cute-clipart/32/000000/delete-sign.png"/></button>`;

                    sortable.dragger.enable();
                    document.querySelector('#search').disabled = false;
                    setTimeout(resetAllLayout, 300);
                  }
                }
                
                if (change.type === "removed") {
                  const sortable = sortables.find(sortable => sortable.element.id === change.doc.id);
                  sortable.dragger.disable();
                  sortable.element.remove();
                  sortables.splice(sortable.index, 1);
                  //if (document.querySelector('#search').value === '') {
                    sortables.forEach((sortable, index) => sortable.setIndex(index));
                    container.style.height = `${sortables[sortables.length - 1].location.y + sortables[sortables.length - 1].location.height + 62}px`;
                  //}
                  total = sortables.length;
                }
            });
        }, function (err) {
            console.log(err.message)
        });
        setupUI(user);
    } else {
        console.log('user logged out');
        //clear array of draggable
        sortables.splice(0,sortables.length);
        //clear DOM
        container.innerHTML="";
        container.style.height = '0px';
        setupUI();
    }
})

container.addEventListener('click', (ev) => {
  if (ev.target.closest('button')) {
    if (ev.target.closest('button').classList.contains('edit')) {

      //document.querySelector('#search').disabled = true;
      
      if (document.querySelector('#search').value === '') {

        document.querySelector('#search').disabled = true;

        const listItem = ev.target.closest('.list-item');
        const listItemId = listItem.id;

        const sortable = sortables.find(sortable => sortable.element.id === listItemId);
        sortable.dragger.disable();

        const textToEdit = listItem.querySelector('.to-replace-content').innerText.trim();
        const div = listItem.querySelector('.to-replace-content');
        const dubContent = div.innerHTML;

        div.innerHTML = `<form id="edit-item-form-${listItemId}"><textarea id="edit-item-input-${listItemId}" placeholder="Update the item" spellcheck="false" rows="1">${textToEdit}</textarea></form>`;

        setInitTextAreaHeight();
        function setInitTextAreaHeight() {
          const area = div.querySelector('textarea');
          //const offset = this.offsetHeight - this.clientHeight;
          const offset = 1 + 1;//borders
          area.style.height = 'auto';
          area.style.height = area.scrollHeight + offset + 'px';
        }

        setTimeout(resetAllLayout, 50);

        div.querySelector('textarea').addEventListener('input', autoResize);
              
        function autoResize() {
          const offset = 1 + 1;//borders
          this.style.height = 'auto';
          this.style.height = event.target.scrollHeight + offset + 'px';
          setTimeout(resetAllLayout, 50);
        }

        const itemActions = listItem.querySelector('.item-action');
        const dubActions = itemActions.innerHTML;

        itemActions.innerHTML = `<button type="submit" form="edit-item-form-${listItemId}"><img class="update" src="https://img.icons8.com/nolan/32/approve-and-update.png"/></button><button id="cancel-edit-${listItemId}"><img class="cancel" src="https://img.icons8.com/color/32/000000/rollback.png"/></button>`

          const cancelBtn = listItem.querySelector(`#cancel-edit-${listItemId}`);
          cancelBtn.addEventListener('click', () => {
            document.querySelector('#search').disabled = false;
            div.innerHTML = dubContent;
            itemActions.innerHTML = dubActions;
            sortable.dragger.enable();
            setTimeout(resetAllLayout, 50);
          })

          const editForm = listItem.querySelector(`#edit-item-form-${listItemId}`);
          editForm.addEventListener('submit', updateRequest);

          function updateRequest(e) {
            e.preventDefault();

            db.collection("users")
              .doc(auth.currentUser.uid)
              .collection('list')
              .doc(listItemId)
              .update({
                content: editForm[`edit-item-input-${listItemId}`].value.trim(),
              })
              .then(() => {
                console.log('updated')
              })
          }
        }
    }
  
    if (ev.target.closest('button').classList.contains('delete')) {
      if (document.querySelector('#search').value === '') {
        const listItem = ev.target.closest('.list-item');
        const listItemId = listItem.id;

        const sortable = sortables.find(sortable => sortable.element.id === listItemId);
        sortable.dragger.disable();

        db.collection("users")
              .doc(auth.currentUser.uid)
              .collection('list')
              .doc(listItemId)
              .delete()
              .then(() => {
                console.log('deleted')
              })
      }
    }

    if (ev.target.closest('button').classList.contains('complete')) {
      const listItem = ev.target.closest('.list-item');
      const listItemId = listItem.id;

      const complete = (listItem.dataset.complete === 'false') ? 'true' : 'false';
      listItem.dataset.complete = complete;

      db.collection("users")
      .doc(auth.currentUser.uid)
      .collection('list')
      .doc(listItemId)
      .update({
        complete: complete
      })
    }

  
  }
})


//******MODALS***********************************************************************//

const loggedOutLinks = document.querySelectorAll('.logged-out');
const loggedInLinks = document.querySelectorAll('.logged-in');

function setupUI(user) {
    if (user) {
        loggedInLinks.forEach(item => item.style.display = "block");
        loggedOutLinks.forEach(item => item.style.display = "none");
    } else {
        loggedInLinks.forEach(item => item.style.display = "none");
        loggedOutLinks.forEach(item => item.style.display = "block");
    }
}

const signupForm = document.querySelector('#signup-form');
signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    //get user info
    const email = signupForm['signup-email'].value;
    const password = signupForm['signup-password'].value;
    //sign up the user and create DB collection "users", add document with the same ID as new user just created => inside create another collection "list" with auto-generated doc with required fields
    auth.createUserWithEmailAndPassword(email, password)
        .then(cred => {
            return db.collection('users').doc(cred.user.uid).collection('list').add({
                ["user\'s email"]: signupForm['signup-email'].value
            })
        })
})

const logout = document.querySelector('#logout');
logout.addEventListener('click', (e) => {
    e.preventDefault();
    if (auth.currentUser) {
        auth.signOut()
            .then(() => {
              console.log('logged out');
            });
    }
})

const loginForm = document.querySelector('#login-form');
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    //get user info
    const email = loginForm['login-email'].value;
    const password = loginForm['login-password'].value;
    //log in the user
    auth.signInWithEmailAndPassword(email, password);
})

//BD code
const addForm = document.querySelector('#add-item-form');
addForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (document.querySelector('#search').value === '') {
          //get current sign in user uid and assosiated doc by uid
      if (auth.currentUser) {
        db.collection('users').doc(auth.currentUser.uid).collection('list').add({
            content: addForm['add-item-input'].value,
            complete: 'false',
            createdate: new Date(),//put local brawser date
            index: 0
        }).then(() => $("#add-item-input").val(""))
      } else {
        console.log('no user logged in');
      }
    }
})

const account = document.querySelector('#account');
account.addEventListener('click', () => {
  const accountInfo = document.querySelector('#account-info');
  if (auth.currentUser) {
    accountInfo.innerHTML = `You are logged in as ${auth.currentUser.email}`;
    return
  }
    accountInfo.innerHTML = `NO USER LOGGED IN`;
})


document.querySelector('#search').oninput = function() {
    let val = this.value.trim();

    let sortablesToShow = [];
    let sortablesToHide = [];

    if (val !== '') {
      sortables.forEach((sortable) => sortable.dragger.disable());

      //sortablesToHide.splice(0,sortablesToHide.length);

      sortablesToHide = sortables.filter(sortable => sortable.element.querySelector('.to-replace-content').innerText.search(val) === -1);

      //sortablesToShow.splice(0,sortablesToShow.length);

      sortablesToShow = sortables.filter(sortable => sortable.element.querySelector('.to-replace-content').innerText.search(val) !== -1);


        sortablesToHide.forEach(sortable => {
          sortable.element.classList.add('hide');
          sortable.element.querySelector('.to-replace-content').innerHTML = sortable.element.querySelector('.to-replace-content').innerText;
        });


        sortablesToShow.forEach((sortable, indx) => {
          let str = sortable.element.querySelector('.to-replace-content').innerText;
          sortable.element.querySelector('.to-replace-content').innerHTML = insertMark(str, sortable.element.querySelector('.to-replace-content').innerText.search(val), val.length);
          sortable.element.classList.remove('hide');

          if (indx === 0) {
            sortable.location.y = 0;
          } else {
            sortable.location.y = sortablesToShow[indx - 1].location.y + sortablesToShow[indx - 1].location.height + gap;
          };

          if (indx === sortablesToShow.length - 1) {
            container.style.height = `${sortable.location.y + sortable.location.height + 62}px`
          }

          gsap.to(sortable.element, {
            duration: 0.3,
            x: 0,
            y: sortable.location.y
          });

        });

    } else {
      sortablesToHide.splice(0,sortablesToHide.length);
      sortablesToShow.splice(0,sortablesToShow.length);

      
      sortables.forEach((sortable, idex) => {
        sortable.dragger.enable();

        if (idex === sortables.length - 1) {
          container.style.height = `${sortable.location.y + sortable.location.height + 62}px`
        };

        sortable.setIndexSearch(idex);
        sortable.element.classList.remove('hide');
        sortable.element.querySelector('.to-replace-content').innerHTML = sortable.element.querySelector('.to-replace-content').innerText;
      })
    }

}

function insertMark(string, pos, len) {
  return string.slice(0, pos) + '<mark>'+ string.slice(pos, pos + len) + '</mark>' + string.slice(pos + len);
}