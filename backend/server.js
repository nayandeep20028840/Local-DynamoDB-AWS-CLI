const express = require("express"); // not used in codestax.ai
const AWS = require("aws-sdk");
const cors = require("cors");

const app = express();
app.use(cors({ origin: "http://localhost:5000" }));
app.use(express.json());

const dynamodb = new AWS.DynamoDB.DocumentClient({ region: "local", endpoint: "http://localhost:8000" });

const TABLE_NAME = "PaymentBanking";

app.post("/users", async (req, res) => {
    const userId = Date.now().toString();
    const params = {
        TableName: TABLE_NAME,
        Item: {
            PK: `USER#${userId}`,
            SK: "PROFILE",
            name: req.body.name,
            email: req.body.email,
            entityType: "USER"
        }
    };
    await dynamodb.put(params).promise();
    console.log(userId);
    res.send({ userId });
});

app.post("/transactions", async (req, res) => {
    const { userId, amount, detail } = req.body;
    const params = {
        TableName: TABLE_NAME,
        Item: {
            PK: `USER#${userId}`,
            SK: `TX#${new Date().toISOString()}`,
            amount: amount,
            detail: detail,
            entityType: "TRANSACTION"
        }
    };
    await dynamodb.put(params).promise();
    res.send({ message: "Transaction recorded" });
});

app.get("/dashboard/:userId", async (req, res) => {
    const params = {
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: {
            ":pk": `USER#${req.params.userId}`
        }
    };
    const data = await dynamodb.query(params).promise();
    res.send(data.Items);
});

app.listen(3000, () => {
    console.log("Backend running on port 3000");
});