import {
  S3Client,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import csv from "csv-parser";

const sendSQS = async (product) => {
  console.log("send sqs with product data:");
  console.log({ ...product });

  try {
    // TODO:
    const sqsClient = new SQSClient();
    // should 'https://sqs.region.amazon.com/id/queueName'
    const queueUrl =
      "https://sqs.eu-west-1.amazonaws.com/887176529808/CatalogItemsQueue";

    const sendMessageCommand = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(product),
      // MessageAttributes: ""
    });

    const result = await sqsClient.send(sendMessageCommand);
    console.log("send result:");
    console.log(result);
  } catch (e) {
    console.warn("error sending SQS");
    console.log(e);
  }
};

const moveParsedFile = async (s3Client, bucketParams) => {
  console.log("* moveParsedFile *");

  try {
    const { Bucket: bucketName, Key: objectKey } = bucketParams;
    let result;

    console.log("bucketName:", bucketName);
    console.log("objectKey:", objectKey);

    const destinationKey = "parsed/" + objectKey.split("/")[1];

    const copyParams = {
      Bucket: bucketName,
      CopySource: encodeURIComponent(bucketName + "/" + objectKey),
      Key: destinationKey,
    };

    console.log("copyParams");
    console.log(copyParams);

    result = await s3Client.send(new CopyObjectCommand(copyParams));
    console.log("CopyObjectCommand result:");
    console.log(result);

    console.log("deleting");
    result = await s3Client.send(new DeleteObjectCommand(bucketParams));
    console.log("DeleteObjectCommand result:");
    console.log(result);

    return true;
  } catch (e) {
    console.log("error");
    console.log(e?.message || e);
  }
};

// get object of new object in s3 bucket and parse it in case it is csv file

export const handler = async (event) => {
  try {
    console.log("event:");
    console.log({ ...event });

    console.log("s3");
    console.log(event.Records[0].s3);

    const s3Client = new S3Client();

    const csvParseOptions = {
      mapValues: ({ header, value }) => {
        if (/price/.test(header)) {
          return parseFloat(value);
        } else if (/count/.test(header)) {
          return parseInt(value);
        } else {
          return value; // string
        }
      },
    };

    //
    const execPromises = event.Records.map(async (record) => {
      const bucketName = record.s3.bucket.name;
      const objectKey = record.s3.object.key;

      console.log("record s3");
      console.log(record.s3);

      const params = {
        Bucket: bucketName,
        Key: decodeURIComponent(objectKey),
      };

      console.log("bucketName:", bucketName);
      console.log("objectKey:", objectKey);

      const command = new GetObjectCommand(params);
      const response = await s3Client.send(command);
      const readStream = response.Body;

      let parseCSVResults = [];

      return await new Promise((resolve, reject) => {
        readStream
          .pipe(csv(csvParseOptions))
          .on("data", (chunk) => {
            parseCSVResults.push(chunk);
          })
          .on("end", async () => {
            console.log("results:");
            console.log([...parseCSVResults]);
            await moveParsedFile(s3Client, params);
            parseCSVResults.map(async (i) => await sendSQS(i));
            resolve(true);
          })
          .on("error", (e) => {
            console.log("error parsing ", objectKey);
            console.log(e?.message || "unknown error");
            reject(e);
          });
      });
    });
    await Promise.allSettled(execPromises);
  } catch (e) {
    console.log("some error happens");
    console.log(e?.message || "unknown error");
  } finally {
    console.log("-- EOF --");
  }
};
