import {Paddle, Environment } from "@paddle/paddle-node-sdk";
const paddle = new Paddle(
    process.env.PADDLE_API_KEY,
    {
        environment : 'production'
    }
)
export default paddle