const BASE_URL = "http://localhost:8000/api";
const LOGIN_URL = `${BASE_URL}/auth/loginOfficial`;
const TRANSACTIONS_URL = `${BASE_URL}/admin/getAllTransactions`;

async function digestMessage(message) {
    const msgUint8 = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgUint8); // hash the message
    const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
    const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""); // convert bytes to hex string
    return hashHex;
}

async function login() {
    event.preventDefault();

    let managerEmail = document.getElementById("managerEmail").value;
    let managerPassword = document.getElementById("managerPassword").value;

    if (!(typeof managerEmail === "string" && managerEmail.length > 0)) {
        alert("Please enter a valid email");
        return;
    }

    if (
        !(typeof managerPassword === "string" && managerPassword.length > 0)
    ) {
        alert("Please enter a valid password");
        return;
    }

    const requestBody = {
        managerEmail: managerEmail,
        managerPassword: await digestMessage(managerPassword),
    };
    const response = await fetch(LOGIN_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
    });

    if (response.status === 200) {
        const data = await response.json();

        localStorage.setItem("SECERT_TOKEN", data.SECRET_TOKEN);
        localStorage.setItem("MANAGER_FULL_NAME", data.managerFullName);
        localStorage.setItem("MANAGER_EMAIL", data.managerEmail);
        localStorage.setItem("MANAGER_ROLE_ID", data.managerRoleId);

        if (data.managerRoleId !== 1 && data.managerRoleId !== 2) {
            alert("You are not authorized to access this page.");
            return;
        }

        window.location.href = "transactions.html";

    } else if (response.status === 500) {
        alert("Server error");
    } else {
        alert("Something's not right bro.");
    }
};

async function fetchTransactions(transactionStatus) {
    const response = await fetch(TRANSACTIONS_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("SECERT_TOKEN")}`,
        },
        body: JSON.stringify({
            "transactionStatus": transactionStatus,
        }),
    });

    if (response.status === 200) {
        const data = await response.json();

        let table = document.querySelector("#transactionsTable");
        table.innerHTML = "";

        let tData = data["transactions"];

        tData.forEach((transaction) => {
            let row = document.createElement("tr");

            let transactionData = document.createElement("td");
            transactionData.innerHTML = `${transaction.txnId}<br/>₹${transaction.amount}<br/>${transaction.productinfo}`;
            row.appendChild(transactionData);

            let userData = document.createElement("td");
            userData.innerHTML = `${transaction.userId}<br/>${transaction.firstname}<br/>${transaction.email}<br/>${transaction.phone}`;
            row.appendChild(userData);

            let transactionStatusData = document.createElement("td");
            transactionStatusData.innerHTML = `${statusName(transaction.transactionStatus)}<br/>${seatString(transaction.seatsReleased)}`;
            row.appendChild(transactionStatusData);

            let timeData = document.createElement("td");
            timeData.innerHTML = `cr: ${transaction.createdAt}<br/>ex: ${transaction.expiryTime}<br/>up: ${transaction.lastUpdatedAt}`;
            row.appendChild(timeData);

            let actions = document.createElement("td");
            let releaseButton = document.createElement("button");
            releaseButton.innerText = "Action TBD";
            actions.appendChild(releaseButton);
            row.appendChild(actions);

            table.appendChild(row);
        });

    } else if (response.status === 500) {
        alert("Server error");
    } else if (response.status === 401) {
        localStorage.clear();
        alert("Unauthorized access");
        window.location.href = "index.html";
    }
}

function statusName(status) {
    switch (status) {
        case "0":
            return "Pending";
        case "1":
            return "Success";
        case "2":
            return "Failed";
        default:
            return "Unknown";
    }
}

function seatString(released) {
    return released === 0 ? "Seats Not Released" : "Seats Released";
}

function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}
