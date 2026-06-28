/* ==========================================================
   ATLAS ENGINE
   Version 1.0
========================================================== */

"use strict";

/* ----------------------------------------------------------
   App State
---------------------------------------------------------- */

const state = {
    currentScreen: "home",
    currentItem: null
};

/* ----------------------------------------------------------
   DOM
---------------------------------------------------------- */

const screens = document.querySelectorAll(".screen");
const homeCards = document.getElementById("homeCards");
const detailTitle = document.getElementById("detailTitle");
const detailContent = document.getElementById("detailContent");
const backButton = document.getElementById("backButton");

/* ----------------------------------------------------------
   Helpers
---------------------------------------------------------- */

function showScreen(id){

    screens.forEach(screen=>{

        screen.classList.remove("active");

        if(screen.id===id){

            screen.classList.add("active");

        }

    });

    state.currentScreen=id;

}

function stars(value){

    let s="";

    for(let i=1;i<=5;i++){

        s+= i<=value ? "★":"☆";

    }

    return s;

}

function clearDetail(){

    detailContent.innerHTML="";

}

/* ----------------------------------------------------------
   Card Builder
---------------------------------------------------------- */

function createCard(item){

    const card=document.createElement("div");

    card.className="card";

    card.innerHTML=`

        <div class="card-icon">
            ${item.icon}
        </div>

        <div class="card-title">
            ${item.title}
        </div>

        <div class="card-text">
            ${item.description}
        </div>

        <div class="badge">
            ${item.badge}
        </div>

    `;

    card.onclick=()=>openModule(item.id);

    return card;

}

/* ----------------------------------------------------------
   Home
---------------------------------------------------------- */

function renderHome(){

    homeCards.innerHTML="";

    Atlas.home.forEach(item=>{

        homeCards.appendChild(createCard(item));

    });

}

/* ----------------------------------------------------------
   Detail Helpers
