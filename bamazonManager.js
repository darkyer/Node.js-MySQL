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
        console.log("\nHere is a list of all products available...\n");
        for (let index = 0; index < res.length; index++) {
            console.log("Id: " + res[index].item_id
                + " - " + res[index].product_name
                + " - " + res[index].department_name
                + " - $" + res[index].price
                + " - " + res[index].stock_quantity + " units.");
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
                "View Products for Sale",
                "View Low Inventory",
                "Add to Inventory",
                "Add New Product",
                "Exit"
            ]
        }
    ]).then(function (answers) {

        switch (answers.action) {
            case "View Products for Sale":
                readProducts();
                break;
            case "View Low Inventory":
                viewLowInventory();
                break;
            case "Add to Inventory":
                addInventory();
                break;
            case "Add New Product":
                postItem();
                break;
            case "Exit":
                exit();
                break;
        }

    });
}

function viewLowInventory() {
    console.log("\n")
    connection.query("SELECT * FROM products WHERE stock_quantity < 5", function (err, res) {
        for (let index = 0; index < res.length; index++) {
            console.log("Id: " + res[index].item_id
                + " - " + res[index].product_name
                + " - " + res[index].department_name
                + " - $" + res[index].price
                + " - " + res[index].stock_quantity + " units.");
        }
        console.log("\n");
        askAction();
    });

}

function postItem() {
    inquirer.prompt([
        {
            type: "input",
            name: "itemNamePrompt",
            message: "Please introduce the item name you want to add."
        },
        {
            type: "input",
            name: "itemPricePrompt",
            message: "Please introduce the item price you want to add."
        },
        {
            type: "input",
            name: "itemDepartmentPrompt",
            message: "Please introduce the department."
        },
        {
            type: "input",
            name: "itemStockPrompt",
            message: "Please introduce how many you want to add."
        }
    ]).then(function (answers) {
        createProduct(answers.itemNamePrompt,
            parseInt(answers.itemPricePrompt),
            answers.itemDepartmentPrompt,
            answers.itemStockPrompt);
    });
}

function addInventory() {
    inquirer.prompt([
        {
            type: "input",
            name: "itemToAdd",
            message: "Please introduce the id of the item you want to add."
        },
        {
            type: "input",
            name: "amountToAdd",
            message: "Please introduce the amount of items you want to add."
        }
    ]).then(function (answers) {
        connection.query("SELECT * FROM products WHERE ?",
            [{
                item_id: answers.itemToAdd
            }],
            function (err, res) {
                console.log("\n");
                console.log("Added " + answers.amountToAdd + " to: " + res[0].product_name);
                updateProduct(answers.itemToAdd, res[0].stock_quantity, answers.amountToAdd);
            });
    });
}

function updateProduct(id, stock, amountToAdd) {
    var finalAmount = parseInt(stock) + parseInt(amountToAdd);
    var query = connection.query(
        "UPDATE products SET ? WHERE ?",
        [
            {
                stock_quantity: finalAmount
            },
            {
                item_id: id
            }
        ],
        function (err, res) {
            console.log("\n");
            askAction();
        }
    );
}

function createProduct(itemName, itemPrice, itemDepartment, stock) {
    console.log("\nChequing existanse of product with name: " + itemName + " and price: " + itemPrice + " with: " + stock + " units.\n");

    connection.query("SELECT * FROM products WHERE ?",
        [{
            product_name: itemName
        }],
        function (err, res) {
            if (res.length > 0) {
                console.log("Product exist updating insted of creating a new one\n");
                updateProduct(res[0].item_id, res[0].stock_quantity, stock);
                return;
            } else {
                console.log("Product doesn't exist, creating a new one\n");
                var query = connection.query(
                    "INSERT INTO products SET ?",
                    {
                        product_name: itemName,
                        price: itemPrice,
                        department_name: itemDepartment,
                        stock_quantity: stock
                    },
                    function (err, res) {
                        askAction();
                    }
                );
            }
        });
}

function exit() {
    connection.end();
}