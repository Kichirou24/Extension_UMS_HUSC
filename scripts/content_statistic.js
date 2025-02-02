// Create button 'Statistics'
const style = document.createElement("style");
style.innerHTML = `
    .btn-export {
        width: 50px; 
        height: 50px;
        padding: 10px;
        display: flex;
        justify-content: center;
        align-items: center;
        transition: width 0.3s ease-in-out, padding 0.3s ease-in-out;
        white-space: nowrap; 
    }

    .btn-export:hover {
        width: 180px; 
        padding: 10px 15px;
    }

    .btn-export span {
        display: none; 
    }

    .btn-export:hover span {
        display: inline; 
    }

    .btn-export:hover svg {
        display: none;    
    }
`;

document.head.appendChild(style);

const button = document.createElement("button");
button.classList.add("btn-export");

button.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-graph-up" viewBox="0 0 16 16">
        <path fill-rule="evenodd" d="M0 0h1v15h15v1H0zm14.817 3.113a.5.5 0 0 1 .07.704l-4.5 5.5a.5.5 0 0 1-.74.037L7.06 6.767l-3.656 5.027a.5.5 0 0 1-.808-.588l4-5.5a.5.5 0 0 1 .758-.06l2.609 2.61 4.15-5.073a.5.5 0 0 1 .704-.07"/>
    </svg>
    <span>Statistics</span>
`;

button.style.position = "fixed";
button.style.top = "50%";
button.style.right = "0px";
button.style.transform = "translateY(-50%)";
button.style.overflow = "hidden";
button.style.background = "#007bff";
button.style.color = "white";
button.style.border = "none";
button.style.borderRadius = "5px 0 0 5px";
button.style.cursor = "pointer";
button.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
button.style.zIndex = "9999";
button.style.fontSize = "16px";

button.style.display = "flex";
button.style.alignItems = "center";
button.style.justifyContent = "center";

document.body.appendChild(button);