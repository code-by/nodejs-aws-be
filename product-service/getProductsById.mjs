import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  TransactGetCommand,
  DynamoDBDocumentClient,
} from "@aws-sdk/lib-dynamodb";
import { buildResponse, getTablesNames } from "../common/utils.mjs";

const getProductById = async (id) => {
  console.log("request product with id:", id);

  let tableProducts, tableStocks;

  try {
    ({ tableProducts, tableStocks } = getTablesNames());
  } catch (e) {
    throw e;
  }

  try {
    const client = new DynamoDBClient();
    const docClient = DynamoDBDocumentClient.from(client);
  
    const transactionRequest = {
      TransactItems: [
        {
          Get: {
            TableName: tableProducts,
            Key: {
              id,
            },
          },
        },
        {
          Get: {
            TableName: tableStocks,
            Key: {
              product_id: id,
            },
          },
        },
      ],
    };

    const command = new TransactGetCommand(transactionRequest);
    const result = await docClient.send(command);

    let product_id, body;

    if (result?.Responses.length == 2) {
      if (
        result?.Responses[0].Item?.id &&
        result?.Responses[1].Item?.product_id
      ) {
        ({ product_id, ...body } = {
          ...result.Responses[0].Item,
          ...result.Responses[1].Item,
        });
      } else {
        if (
          !result?.Responses[0].Item?.id &&
          !result?.Responses[1].Item?.product_id
        ) {
          throw {
            statusCode: 404,
            message: "Product not found",
          };
        } else {
          throw { message: "DB Error" };
        }
      }
    } else {
      throw { message: "DB Error" };
    }

    return {
      statusCode: 200,
      body,
    };
  } catch (e) {
    return {
      statusCode: e.statusCode || 500,
      body: { message: e?.message || "Unknown Server Error" },
    };
  }
};

export const handler = async (event) => {
  let body;
  let statusCode = 500;
  const headers = {
    "Content-Type": "application/json",
  };

  try {
    const { pathParameters } = event;

    if (!pathParameters || !pathParameters.productId) {
      return buildResponse(400, { message: "Invalid route!" });
    }

    const productId = pathParameters.productId;

    ({ statusCode, body } = await getProductById(productId));

    return buildResponse(statusCode, body, headers);
  } catch (err) {
    console.log("some error happens");
    console.log(err);
    statusCode = 500;
    body = { message: err.message || "unknown error" };
    return buildResponse(statusCode, body, headers);
  }
};
