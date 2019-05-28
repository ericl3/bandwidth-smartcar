const express = require("express");
const messages = require("../config/messages");
const numbers = require("../config/numbers");
const smartcar = require('smartcar');
const keys = require("../config/keys");

class ConnectRouter {
    constructor(BandwidthClient, smartcarClient) {
        this.access = "unauthorized";
        this.bwClient = BandwidthClient;
        this.vehicle;
        this.smartcarClient = smartcarClient;
        this.router = express.Router();
        this.router.get("/", this.handleLogin.bind(this));
        this.router.get("/exchange", this.handleExchange.bind(this));
        this.router.post("/text", this.receiveText.bind(this));
    }


    handleLogin(req, res) {
        const link = this.smartcarClient.getAuthUrl();
        res.redirect(link);
    }

    handleExchange(req, res) {
        const code = req.query.code;
        return this.smartcarClient.exchangeCode(code)
            .then((_access) => {
                this.access = _access;
                this.smartcarClient.isCompatible("JTHCF1D132E5015551", keys.scope).then(result => {
                    res.json(result);
                });
                this.createVehicle();
            });
    }

    receiveText(req, res) {
        if (this.access === "unauthorized") {
            this.sendText(req.body.from, messages.unauthorized);
        } else {
            //this.createVehicle(req.body.text, req.body.from);
            this.handleQuery(this.vehicle, req.body.text, req.body.from);
        }
    }

    sendText(dest, textMessage) {
        var message = {
            from: numbers[0],
            to: dest,
            text: textMessage

        }
        this.bwClient.Message.send(message).then(message => {
            console.log("Message sent with ID " + message.id);
        })
    }

    createVehicle(query, dest) {
        return smartcar.getVehicleIds(this.access.accessToken)
            .then(data => {
                return data.vehicles
            })
            .then(vehicleIds => {
                //const vehicle = new smartcar.Vehicle(vehicleIds[0], this.access.accessToken);
                this.vehicle = new smartcar.Vehicle(vehicleIds[0], this.access.accessToken);
                //this.handleQuery(vehicle, query, dest);
            })
    }

    handleQuery(vehicle, query, dest) {
        var queryFinal = query.toLowerCase().trim();
        if (queryFinal === "get vehicle info") {
            return vehicle.info().then(info => {
                console.log(info);
                this.sendText(dest, "id: " + info.id + "\n"
                    + "make: " + info.make + "\n"
                    + "model: " + info.model + "\n"
                    + "year: " + 2018 + "\n");
            }
            );
        } else if (queryFinal === "lock") {
            return vehicle.lock().then(security => {
                console.log(security);
                this.sendText(dest, "Car Lock: " + security.status);
            })
        } else if (queryFinal === "unlock") {
            return vehicle.unlock().then(security => {
                console.log(security);
                this.sendText(dest, "Car Unlock: " + security.status);
            })
        } else if (queryFinal === "check odometer") {
            return vehicle.odometer().then(odometer => {
                console.log(odometer);
                this.sendText(dest, "Distance: " + odometer.data.distance + "\n"
                    + "Timestamp: " + odometer.age + "\n"
                    + "Unit System: " + odometer.unitSystem + "\n");
            })
        } else if (queryFinal === "check location") {
            return vehicle.location().then(location => {
                console.log(location);
                this.sendText(dest, "Latitude: " + location.data.latitude + "\n"
                    + "Longitude: " + location.data.longitude + "\n"
                    + "Timestamp: " + location.age + "\n");
            })
        } else if (queryFinal === "disconnect car") {
            return vehicle.disconnect().then(connection => {
                console.log(connection);
                this.sendText(dest, "Car Disconnected: " + connection.status + "\n");
            })
        } else {
            this.sendText(dest, messages.unknownCommand);
        }
    }

}

module.exports = ConnectRouter;