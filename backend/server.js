const express = require("express");
const AWS = require("aws-sdk");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
app.use(cors({ origin: "http://localhost:5000" }));
app.use(express.json());

const dynamodb = new AWS.DynamoDB.DocumentClient({ region: "local", endpoint: "http://localhost:8000" });

const TABLE_NAME = "PaymentBanking";
const GSI_NAME = "UserTransactionsIndex";

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
    res.send({ userId });
});

app.post("/transactions", async (req, res) => {
    const { userId, amount, detail } = req.body;
    const txId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    const params = {
        TableName: TABLE_NAME,
        Item: {
            PK: `TX#${txId}`, 
            SK: `TS#${timestamp}`,
            
            GSI_PK: `USER#${userId}`,
            GSI_SK: `TS#${timestamp}`,
            
            amount: amount,
            detail: detail,
            entityType: "TRANSACTION"
        }
    };
    await dynamodb.put(params).promise();
    res.send({ message: "Transaction recorded", transactionId: txId });
});

app.get("/dashboard/:userId", async (req, res) => {
    const params = {
        TableName: TABLE_NAME,
        IndexName: GSI_NAME,
        KeyConditionExpression: "GSI_PK = :pk",
        ExpressionAttributeValues: {
            ":pk": `USER#${req.params.userId}`
        },
        ScanIndexForward: false
    };
    
    try {
        const data = await dynamodb.query(params).promise();
        res.send(data.Items);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

app.listen(3000, () => {
    console.log("Backend running on port 3000");
});