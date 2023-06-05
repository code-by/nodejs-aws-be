import { describe, it, expect } from "@jest/globals";
import { buildResponse } from "./utils.mjs";
import { products } from "./mocks.mjs";
import { handler } from "./getProductsList.mjs";

describe("getProductsList", () => {
  it("products list", async () => {
    const response = await handler();
    expect(response).toEqual(
      buildResponse(200, products, {
        "Content-Type": "application/json",
      })
    );
  });
});
