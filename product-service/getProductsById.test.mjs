import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import { buildResponse } from "../common/utils.mjs";
import { products } from "./mocks.mjs";
import { handler } from "./getProductsById.mjs";

describe.skip("getProductsById", () => {
  const env = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...env };
  });

  afterEach(() => {
    process.env = env;
  });

  it("product by id", async () => {
    const pathParameters = {
      productId: products[0].id,
    };
    process.env.TABLE_PRODUCTS = "products";
    process.env.TABLE_STOCKS = "stocks";
    const response = await handler({ pathParameters });
    expect(response).toEqual(
      buildResponse(200, products[0], {
        "Content-Type": "application/json",
      })
    );
  });
});
