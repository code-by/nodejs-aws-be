import {
  DynamoDBClient,
  TransactWriteItemsCommand,
} from "@aws-sdk/client-dynamodb";
import { randomUUID } from "crypto";

import { buildResponse, getTablesNames } from "../common/utils.mjs";

const dynamo = new DynamoDBClient();

export const handler = async (event) => {

  let body = {};
  let statusCode;
  const headers = {
    "Content-Type": "application/json",
  };

  try {

    statusCode = 400;
    const parsed_body = JSON.parse(event.body);
    if (typeof parsed_body !== 'object') {
      throw ({message: 'bad request'});
    }

    // check request data:
    let { title, description, count, price } = parsed_body || "";

    const request_data = {
      title,
      description,
      price,
      count,
    };
    console.log('request data:', request_data);

    title = title ? title.trim() : "";
    description = description ? description.trim() : "";

    if (!title || !description || !(0 + price > 0) || !(0 + count > 0)) {
      return buildResponse(
        400,
        { message: "one of values is missing" },
        headers
      );
    }

    const id = randomUUID();

    let tableProducts, tableStocks;

    try {
      ({ tableProducts, tableStocks } = getTablesNames());
    } catch (e) {
      throw e;
    }

    const params = {
      TransactItems: [
        {
          Put: {
            TableName: tableProducts,
            Item: {
              id: { S: id },
              title: { S: title },
              description: { S: description },
              price: { N: `${price}` },
            },
          },
        },
        {
          Put: {
            TableName: tableStocks,
            Item: {
              product_id: { S: id },
              count: { N: `${count}` },
            },
          },
        },
      ],
    };

    statusCode = 500;
    const command = new TransactWriteItemsCommand(params);
    await dynamo.send(command);
 
    statusCode = 201;
    body = {
      result: 'ok',
      id,
    };
 
  } catch (err) {
    body = { err: err.message };
  }

  return buildResponse(statusCode, body, headers);

};
