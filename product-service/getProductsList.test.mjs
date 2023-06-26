/* istanbul ignore file */

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
import { handler } from "./getProductsList.mjs";

describe.skip("getProductsList", () => {
  const env = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...env };
  });

  afterEach(() => {
    process.env = env;
  });

  process.env.TABLE_PRODUCTS = "products";
  process.env.TABLE_STOCKS = "stocks";

  it("products list", async () => {
    const response = await handler();
    expect(response).toEqual(
      buildResponse(200, products, {
        "Content-Type": "application/json",
      })
    );
  });
});
