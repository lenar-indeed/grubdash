const path = require("path");
// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

function list(req, res) {
    res.json({data: dishes});
}

function create(req, res) {
    const {name, description, price, image_url} = req.body.data;
    const newDish = {
      id: nextId(),
      name: name,
      description: description,
      price: price,
      image_url: image_url
    };
    dishes.push(newDish);
    res.status(201).json({ data: newDish });
}

function read(req, res) {
    res.json({ data: res.locals.dish });
}

function update(req, res, next) {
    const foundDish = res.locals.dish;
    const {name, description, image_url, price} = req.body.data;

    foundDish.name = name;
    foundDish.description = description;
    foundDish.price = price;
    foundDish.image_url = image_url;
    res.json({ data: foundDish });
}

function dishIdMatchRouteDishId(req, res, next) {
    const dishId = req.params.dishId;
    const {id} = req.body.data;

    if (id && id !== dishId) {
        next({status: 400, message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`});
    }
    next();
}
  
function dataHas(propertyName) {
    return function (req, res, next) {
      const { data = {} } = req.body;
      if (data[propertyName]) {
        return next();
      }
      next({ status: 400, message: `Dish must include a ${propertyName}` });
    };
}

function dishExists(req, res, next) {
    const dishId = req.params.dishId;
    const foundDish = dishes.find((dish) => dish.id === dishId);
    if (foundDish) {
        res.locals.dish = foundDish;
        return next();
    }
    next({
        status: 404,
        message: `Dish does not exist: ${dishId}.`,
    });
}

function validatePrice(req, res, next) {
    const {price} = req.body.data;
    if (isNaN(price) || !Number.isInteger(price) || price <= 0) {
        next({status: 400, message: "Dish must have a price that is an integer greater than 0"})
    }
    next();
}

module.exports = {
    list,
    create: [
        dataHas("name"),
        dataHas("description"),
        dataHas("price"),
        dataHas("image_url"),
        validatePrice,
        create
    ],
    read: [dishExists, read],
    update: [        
        dishExists, 
        dataHas("name"),
        dataHas("description"),
        dataHas("price"),
        dataHas("image_url"),
        dishIdMatchRouteDishId,
        validatePrice,
        update]
};
