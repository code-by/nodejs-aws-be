import { products } from "./mocks.mjs";
import { buildResponse } from "./utils.mjs";

export const handler = async () => {
  let body;
  let statusCode = 200;
  const headers = {
    "Content-Type": "application/json",
  };

  try {
    body = products;
  } catch (err) {
    console.log("some error happens");
    console.log(err);
    statusCode = "500";
    body = { message: err.message || "unknown error" };
  } finally {
    return buildResponse(statusCode, body, headers);
  }
};
