import { products } from "./mocks.mjs";
import { buildResponse } from "./utils.mjs";

const findProductById = (productId) => {
  try {
    const product = products.filter(({ id }) => id == productId);

    if (!product || !product.length) {
      return {
        statusCode: 404,
        body: { message: "Product not found" },
      };
    }
    return {
      statusCode: 200,
      body: products[0],
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: { message: e?.message || "Unknown error" },
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

    ({ statusCode, body } = findProductById(productId));

    return buildResponse(statusCode, body, headers);
  } catch (err) {
    console.log("some error happens");
    console.log(err);
    statusCode = 500;
    body = { message: err.message || "unknown error" };
    return buildResponse(statusCode, body, headers);
  }
};
