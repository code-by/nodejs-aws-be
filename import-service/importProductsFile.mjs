import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

import { buildResponse } from "../common/utils.mjs";
import { constants } from "../common/constants.mjs";

const presignedUrl = (client, command) => {
  return getSignedUrl(client, command, { expiresIn: 3600 });
};

export const handler = async (event = {}) => {
  let body;
  let statusCode = 200;
  const headers = {
    "Content-Type": "application/json",
  };

  try {
    const { bucketName, uploadCSVFolder } = constants;

    const client = new S3Client();

    const queryString = event?.queryStringParameters;
    console.log("queryString");
    console.log(queryString);
    if (!queryString || Object.keys(queryString).length != 1 || !queryString?.name) {
      throw ({message: 'Bad request', statusCode: 400});
    }

    const putObjectParams = {
      ACL: "public-read-write",
      Bucket: bucketName,
      Key: `${uploadCSVFolder}/${queryString?.name}`,
    };

    const command = new PutObjectCommand(putObjectParams);
    const url = await presignedUrl(client, command);
    body = url;
  } catch (e) {
    console.log("some error happens");
    console.log(e);
    body = { message: e.message || "unknown error" };
    statusCode = e.statusCode || 500;
  }

  return buildResponse(statusCode, body, headers);
};
