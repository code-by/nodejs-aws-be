import { describe, it, expect } from "@jest/globals";
import { buildResponse } from "./utils.mjs";
import { products } from "./mocks.mjs";
import { handler } from "./getProductsById.mjs";

describe("getProductsById", () => {
  it("product by id", async () => {
    const pathParameters = {
      productId: products[0].id,
    };
    const response = await handler({ pathParameters });
    expect(response).toEqual(
      buildResponse(200, products[0], {
        "Content-Type": "application/json",
      })
    );
  });
});
