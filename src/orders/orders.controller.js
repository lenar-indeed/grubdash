const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

function list(req, res) {
    res.json({data: orders});
}

function create(req, res) {
    const {deliverTo, mobileNumber, dishes, status} = req.body.data;
    const newOrder = {
      id: nextId(),
      deliverTo: deliverTo,
      mobileNumber: mobileNumber,
      status: status,
      dishes: dishes
    };
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
}

function read(req, res) {
    res.json({ data: res.locals.order });
}

function update(req, res, next) {
    const orderId = req.params.orderId;
    const foundOrder = res.locals.order;
  
    const {id, deliverTo, mobileNumber, status, dishes} = req.body.data;

    if (id && id !== orderId) {
        next({status: 400, message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`});
    }
    if (foundOrder.status === "delivered") {
        next({status: 400, message: "A delivered order cannot be changed"});
    }
    foundOrder.deliverTo = deliverTo;
    foundOrder.mobileNumber = mobileNumber;
    foundOrder.status = status;
    foundOrder.dishes = dishes;
    res.json({ data: foundOrder });
}

function remove(req, res, next) {
    const { orderId } = req.params;
    const index = orders.findIndex((order) => order.id === orderId);
    if (index > -1) {
        if (orders[index].status !== "pending") {
            next({status: 400, message: `An order cannot be deleted unless it is pending. Returns a 400 status code`});
        }
        orders.splice(index, 1);
    }
    res.sendStatus(204);
  }

function dataHas(propertyName) {
    return function (req, res, next) {
      const { data = {} } = req.body;
      if (data[propertyName]) {
        return next();
      }
      next({ status: 400, message: `Order must include a ${propertyName}` });
    };
}

function validateStatus(req, res, next) {
    const {status} = req.body.data;
    const statuses = ["pending", "preparing", "out-for-delivery", "delivered"];
    if (!status || !statuses.includes(status)) {
        next({ status: 400, message: "Order must have a status of pending, preparing, out-for-delivery, delivered" });
    }
    next();
}

function orderExists(req, res, next) {
    const orderId = req.params.orderId;
    const foundOrder = orders.find((order) => order.id === orderId);
    if (foundOrder) {
        res.locals.order = foundOrder;
      return next();
    }
    next({
      status: 404,
      message: `Order does not exist: ${orderId}.`,
    });
}

function validateDishes(req, res, next) {
    const {dishes} = req.body.data;
    if (!Array.isArray(dishes) || dishes.length === 0) {
        next({status: 400, message: "Order must include at least one dish"})
    }
    for(i = 0; i < dishes.length; i++) {
        if (isNaN(dishes[i].quantity) || !Number.isInteger(dishes[i].quantity) || dishes[i].quantity <= 0) {
            next({status: 400, message: `Dish ${i} must have a quantity that is an integer greater than 0`})
        }
    };
    next();
}

module.exports = {
    list,
    create: [
        dataHas("deliverTo"),
        dataHas("mobileNumber"),
        dataHas("dishes"),
        validateDishes,
        create
    ],
    read: [orderExists, read],
    update: [        
        dataHas("deliverTo"),
        dataHas("mobileNumber"),
        dataHas("dishes"),
        validateStatus,
        validateDishes,
        orderExists,
        update
    ],
    delete: [
        orderExists,
        remove
    ]
};
