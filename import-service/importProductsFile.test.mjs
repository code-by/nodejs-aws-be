// import AWSMock from "aws-sdk-mock";
// import AWS from '@aws-sdk';
import { describe, it, expect, test } from "@jest/globals";
import { jest } from '@jest/globals';
import { buildResponse } from "../common/utils.mjs";
// import { products } from "./mocks.mjs";
import { handler } from "./importProductsFile.mjs";


const queryStringParameters = {name: 'test.csv'};

/*
test("test", async () => {
  getSignedUrl = jest.fn().mockImplementationOnce(
    () => Promise.resolve('abc')
  );
  let result = await handler({ queryStringParameters })
  expect(result).toBe("abc")
})

jest.mock('@aws-sdk/s3-request-presigner', () => {
  const originalModule = jest.requireActual('@aws-sdk/s3-request-presigner');
  return {
    ...originalModule,
    getSignedUrl: jest.fn(async () => {
      return Promise.resolve('http://aws.com');
    }),
  };
});
*/

// import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

describe('importProductsFile', () => {
  it('should return signed url', async () => {
      const response = await handler({ queryStringParameters: {name: 'test.csv'} });
      expect(response).toEqual(buildResponse(
        200,
        {"message": "https://aws.com"},
        {
          "Content-Type": "application/json",
        },        
      ));
  });
});

//let result = await handler({ queryStringParameters });
//expect(result).toBe('abc');

/*
test('fake url', async () => {
  s3.S3RequestPresigner.getSignedUrl = jest.fn().mockImplementationOnce(() => Promise.resolve('abc'))
  //s3.getSignedUrl = jest.fn().mockImplementationOnce(() => Promise.resolve('abc'))
  const queryStringParameters = {name: 'test.csv'};
  const fakeResult = {url: 'http://aws.com', statusCode: 200};
  //expect(await handler({ queryStringParameters })).toBe(fakeResult);
});
*/

describe("importProductsFile", () => {
  /*
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
  */
  it("with name argument", async () => {
    //const S3 = new S3Client();
    //AWSMock.mock('S3', 'putObject', 'test.csv');
    //AWSMock.mock('S3', 'getSignedUrl', Promise.resolve('abc'));
    //sinon.stub(presigner, 'getSignedUrl').resolves('https://s3.amazonaws.com/path/to/object')
    // await __setTest({queryStringParameters});

    const queryStringParameters = {name: 'test.csv'};
    const response = await handler({ queryStringParameters });

    expect(response).toEqual(
        buildResponse(
        200,
        {"message": "https://aws.com"},
        {
          "Content-Type": "application/json",
        },
      )
    );

    //const pendingPromise = __setTest(queryStringParameters);
    // expect(await pendingPromise).toEqual(

  });
});



// AWSMock.restore();
