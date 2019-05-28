// Necessary dependencies
const cors = require('cors');
const express = require('express');
const smartcar = require('smartcar');
const bodyParser = require("body-parser");
const Bandwidth = require("node-bandwidth");
const keys = require("./config/keys");

// Set up apps
const app = express().use(cors());
const PORT = 8080;

// Bring in routes
//const ReceiveQueriesRouter = require("./routes/receive-query");
const ConnectRouter = require("./routes/connect");

// Set up clients
const smartcarClient = new smartcar.AuthClient({
    clientId: keys.cliendId,
    clientSecret: keys.clientSecret,
    redirectUri: keys.redirectUri,
    scope: keys.scope,
    testMode: true
});

const BandwidthClient = new Bandwidth({
    userId: keys.buserId,
    apiToken: keys.bapiToken,
    apiSecret: keys.bapiSecret
});

// Set up body-parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// set up routes
//let receiveQuery = new ReceiveQueriesRouter(BandwidthClient, smartcarClient);
let connect = new ConnectRouter(BandwidthClient, smartcarClient);

//app.use("/receive-query", receiveQuery.router);
app.use("/connect", connect.router);

// Home page GET
app.get("/", (req, res) => {
    res.json({ msg: "go to /connect" });
})

app.listen(PORT, () => {
    console.log("server running on port " + PORT);
});