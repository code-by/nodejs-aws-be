import {
  DynamoDBClient,
  TransactWriteItemsCommand,
} from "@aws-sdk/client-dynamodb";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { randomUUID } from "crypto";
import { getTablesNames } from "../common/utils.mjs";

const dynamo = new DynamoDBClient();

// catalogBatchProcess

const emailMessageTemplate = ({ title, description, price, count }) => `
  New product is just created in AWS CloudShop!
  Title: ${title}
  Price: ${price}
  Count: ${count}
  Description: ${description}
`;

const sendSNS = async ({ title, description, count, price }) => {
  if (process.env.CREATE_PRODUCT_TOPIC_ARN) {
    await new SNSClient().send(
      new PublishCommand({
        Subject: `New product in AWS CloudShop: ${title}`,
        Message: emailMessageTemplate([{ title, description, price, count }]),
        MessageAttributes: {
          title: { DataType: "String", StringValue: title },
          price: { DataType: "Number", Number: price },
        },
        TargetArn: process.env.CREATE_PRODUCT_TOPIC_ARN,
      })
    );
    return true;
  } else {
    console.warn("SNS topic ARN not provided, unable to send email");
    console.log(process.env);
    throw { message: "SNS ARN missed" };
  }
};

const checkAndPrettifyProductData = (product) => {
  let { title, description, count, price } = product || undefined;

  if (!title || !description || !(0 + price > 0) || !(0 + count > 0)) {
    throw { message: "product data incompelete/wrong" };
  }

  title = title ? title.trim() : "";
  description = description ? description.trim() : "";
  return { title, description, count, price };
};

const addProductToDB = async (tableNames, product) => {
  try {
    // add product into DB
    const id = randomUUID();
    const { tableProducts, tableStocks } = tableNames;
    const { title, description, count, price } = product;

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

    const command = new TransactWriteItemsCommand(params);
    await dynamo.send(command);
    return true;
  } catch (e) {
    console.warn("error happens while add product into DB:");
    console.log(e.message || "unknown error");
    console.log("product:");
    console.log(product);
  }
};

export const handler = async (event) => {
  try {
    // eventSource: 'aws:sqs'
    // body

    if (!event?.Records || !(Array.isArray(event.Records)) || event.Records.lenght < 1) {
      throw { message: "Bad request" };
    }

    let tableProducts, tableStocks;

    try {
      ({ tableProducts, tableStocks } = getTablesNames());
    } catch (e) {
      throw e;
    }

    const addResult = event.Records.map(async (r) => {
      let product = await JSON.parse(r?.body);
      product = checkAndPrettifyProductData(product);
      const result = await addProductToDB(
        { tableProducts, tableStocks },
        product
      );
      if (result) {
        return await sendSNS(product);
      } else {
        return await (async () => {});
      }
    });
    await Promise.all(addResult);

    console.info("-- EndOfLog --");

    return { result: true };
  } catch (e) {
    console.warn("error happens");
    console.log(e.message || "unknown error");
    console.log(event);

    return { resut: false, message: e.message || "unknown error" };
  }
};
