import { buildResponse, getTablesNames } from "./utils.mjs";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

export const handler = async () => {
  let body;
  let statusCode = 200;
  const headers = {
    "Content-Type": "application/json",
  };

  try {

    // TODO:
    // 1. get table names from ENV
    // 2. log requests/env data
    let tableProducts, tableStocks;

    try {
      ({ tableProducts, tableStocks } = getTablesNames());
    } catch (e) {
      throw e;
    }

    const client = new DynamoDBClient();

    const productsParams = {};

    let command;

    productsParams.TableName = 'products';
    command = new ScanCommand(productsParams);
    const productsResult = await client.send(command);
    const products = productsResult.Items;

    productsParams.TableName = 'stocks';
    command = new ScanCommand(productsParams);
    const stocksResult = await client.send(command);
    const stocks = stocksResult.Items;
    
    const productsWithStocks = [];

    for (const product of products) {
      const productStock = stocks.find(stock => stock.product_id === product.id);

      if (productStock) {
        const {product_id, ...joinedItem} = {
          ...product,
          ...productStock
        };
        productsWithStocks.push(joinedItem);
      }
    }

    body = productsWithStocks;
  } catch (err) {
    console.log("some error happens");
    console.log(err);
    statusCode = "500";
    body = { message: err.message || "unknown error" };
  } finally {
    return buildResponse(statusCode, body, headers);
  }
};
