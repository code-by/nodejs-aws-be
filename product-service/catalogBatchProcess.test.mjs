import { describe, it, expect, beforeEach, afterAll, beforeAll, afterEach, jest } from "@jest/globals";
import { buildResponse } from "../common/utils.mjs";
import { handler } from "./catalogBatchProcess.mjs";

const queryStringParameters = { name: "test.csv" };

const env = process.env;

const sqsEventMock = {
  Records: [
    {
      body: "{\"title\":\"Book ChatGPT\",\"description\":\"How to use it\",\"price\":99,\"count\":9}",
    },
  ],
};

beforeAll(() => {
  //jest.resetModules();
  //process.env = { ...env };
});

beforeEach(() => {
  jest.resetModules();
  process.env = { ...env };
});

afterEach(() => {
  process.env = env;
});

describe("importProductsFile", () => {
  it("without sqs events", async () => {
    const response = await handler();
    expect(response).toEqual({ message: "Bad request", resut: false });
  });
  it("with sqs events, no env vars table names", async () => {
    const response = await handler(sqsEventMock);
    process.env.TABLE_PRODUCTS = "";
    process.env.TABLE_STOCKS = "";
    expect(response).toEqual({
      message: "Server Configuration Error",
      resut: false,
    });
  });
  it("without SNS ARN", async () => {
    process.env.TABLE_PRODUCTS = "products";
    process.env.TABLE_STOCKS = "stocks";
    const response = await handler(sqsEventMock);
    expect(response).toEqual({ message: "SNS ARN missed", resut: false });
  });
  it("all data provided", async () => {
    process.env.TABLE_PRODUCTS = "products";
    process.env.TABLE_STOCKS = "stocks";
    process.env.CREATE_PRODUCT_TOPIC_ARN =
      "arn:aws:sns:eu-west-1:accountId:CreateProductTopic";
    const response = await handler(sqsEventMock);
    expect(response).toEqual({ result: true });
  });
});
