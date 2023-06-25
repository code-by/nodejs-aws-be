import { describe, it, expect } from "@jest/globals";
import { buildResponse } from "../common/utils.mjs";
import { handler } from "./importProductsFile.mjs";

const queryStringParameters = {name: 'test.csv'};

describe("importProductsFile", () => {
  it("without name argument", async () => {
    const response = await handler();
    expect(response).toEqual(
      buildResponse(
        400,
        {"message": "Bad request"},
        {
          "Content-Type": "application/json",
        },
      )
    );
  });
  it('should return signed url', async () => {
    const response = await handler({ queryStringParameters });
    expect(response).toEqual(buildResponse(
      200,
      "https://aws.com",
      {
        "Content-Type": "application/json",
      },        
    ));
  });
});
