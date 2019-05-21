var mysql = require("mysql");
var inquirer = require("inquirer");

var connection = mysql.createConnection({
    host: "localhost",

    // Your port; if not 3306
    port: 3306,

    // Your username
    user: "root",

    // Your password
    password: "",
    database: "bamazon"
});

connection.connect(function (err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId);
    askAction();
});

function readProducts() {

    connection.query("SELECT * FROM products", function (err, res) {
        if (err) throw err;
        // Log all results of the SELECT statement
        console.log("Here is a list of all products available...\n");
        for (let index = 0; index < res.length; index++) {
            console.log("Id: " + res[index].item_id
                + " Product: " + res[index].product_name
                + " Deparment: " + res[index].department_name
                + " Price: " + res[index].price
                + " Available units: " + res[index].stock_quantity);
        }
        console.log("\n");
        askAction();
    });
}

function askAction() {

    inquirer.prompt([
        {
            type: "list",
            name: "action",
            message: "What do you want to do?",
            choices: [
                "See all products",
                "Buy an item",
                "Exit"
            ]
        }
    ]).then(function (answers) {

        switch (answers.action) {
            case "See all products":
                readProducts();
                break;
            case "Buy an item":
                buyItem();
                break;
            case "Exit":
                exit();
                break;
        }
    });
}

function buyItem() {
    inquirer.prompt([
        {
            type: "input",
            name: "itemToBuy",
            message: "Please introduce the id of the item you want to buy."
        },
        {
            type: "input",
            name: "amountToBuy",
            message: "Please introduce the amount of items you want to buy."
        }
    ]).then(function (answers) {
        buyProduct(answers.itemToBuy, answers.amountToBuy);
    });
}

function buyProduct(id, amount) {
    connection.query("SELECT * FROM products WHERE ?",
        [{
            item_id: id
        }],
        function (err, res) {
            if (parseInt(res[0].stock_quantity) >= parseInt(amount)) {
                var total = parseInt(res[0].price) * amount;
                updateProduct(id, res[0].stock_quantity, amount);
                console.log("You paid: " + total + " and removed " + amount + " units from " + res[0].product_name + "\n");
            } else {
                console.log("We don't have enough units to complete your request\n");
                askAction();
            }
        });
}

function updateProduct(id, originalStock, amountToReduce) {
    console.log("Updating all Rocky Road quantities...\n");
    var remaining = parseInt(originalStock) - parseInt(amountToReduce);
    var query = connection.query(
        "UPDATE products SET ? WHERE ?",
        [
            {
                stock_quantity: remaining
            },
            {
                item_id: id
            }
        ],
        function (err, res) {
            askAction();
        }
    );

    // // logs the actual query being run
    // console.log(query.sql);
}


function exit() {
    connection.end();
}