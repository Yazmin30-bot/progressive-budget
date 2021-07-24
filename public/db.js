let db;

const request = indexedDB.open("budgetapp", 1);
// create object store called "pend" and set autoIncrement to true
request.onupgradeneeded = function (event) {
  const db = event.target.result;
  db.createObjectStore("pend", { autoIncrement: true });
};

// check if app is online before reading from db
request.onsuccess = function (event) {
  db = event.target.result;
  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = function (event) {
  console.log("Woops! " + event.target.errorCode);
};

//Create a transaction of the pending db , access to pending object store and record them
function saveRecord(record) {
  const transaction = db.transaction(["pend"], "readwrite");
  const store = transaction.objectStore("pend");
  store.add(record);
}

// get all records from store and set to a variable
function checkDatabase() {
  const transaction = db.transaction(["pend"], "readwrite");
  const store = transaction.objectStore("pend");
  const getAll = store.getAll();
  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
        .then(response => response.json())
        // if successful, open a transaction on your pending db, access and clear them
        .then(() => {
          const transaction = db.transaction(["pend"], "readwrite");
          const store = transaction.objectStore("pend");
          store.clear();
        });
    }
  };
}

// listen for app coming back online
window.addEventListener("online", checkDatabase);