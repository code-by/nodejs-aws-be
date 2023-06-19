import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambdaNode from "aws-cdk-lib/aws-lambda-nodejs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as lambdaEvents from "aws-cdk-lib/aws-lambda-event-sources";
import * as path from "path";
import { fileURLToPath } from "url";

//import { bucketName, uploadCSVFolder } from "";
import { constants } from "./common/constants.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const commonLambdaProps = {
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "handler",
      /*
      bundling: {
        format: lambdaNode.OutputFormat.ESM,
      },
      */
      environment: {},
    };

    // buckets

    // uploading csv
    //console.warn(constants);
    const { bucketName, uploadCSVFolder } = constants;
    console.warn(bucketName, uploadCSVFolder);

    const bucket = s3.Bucket.fromBucketName(this, bucketName, bucketName);

    //bucket.grantPut();
    /*
    bucket.addCorsRule({
      allowedOrigins: ['*'], // Replace with your desired allowed origins
      allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT], // Replace with desired allowed HTTP methods
      allowedHeaders: ['*'], // Replace with desired allowed headers
      exposedHeaders: ['ETag'], // Replace with desired exposed headers
      maxAge: 300, // Replace with desired max age in seconds
    });
    */

    // lambdas

    // generate signed url
    const importProductsFileLambda = new lambdaNode.NodejsFunction(
      this,
      "ImportProductsFile",
      {
        functionName: "importProductsFile",
        entry: path.join(__dirname, "/import-service/importProductsFile.mjs"),
        ...commonLambdaProps,
      }
    );

    const policyPutObject = new cdk.aws_iam.PolicyStatement({
      actions: ["s3:PutObject"],
      resources: [`arn:aws:s3:::${bucketName}/${uploadCSVFolder}`],
      effect: cdk.aws_iam.Effect.ALLOW,
    });

    importProductsFileLambda.addToRolePolicy(policyPutObject);
    bucket.grantReadWrite(importProductsFileLambda);
    bucket.grantRead(new cdk.aws_iam.AccountRootPrincipal());

    // trigger by new file in /upload folder in bucket, parse csv
    const importFileParserLambda = new lambdaNode.NodejsFunction(
      this,
      "importFileParser",
      {
        functionName: "importFileParser",
        entry: path.join(__dirname, "/import-service/importFileParser.mjs"),
        ...commonLambdaProps,
      }
    );

    /*
    const bucketEventSource = new lambdaEvents.S3EventSource(bucket, {
      events: [s3.EventType.OBJECT_CREATED],
      filters: [{ prefix: "upload/" }],
    });
    */
    // create lambda trigger by s3 event
    //importFileParserLambda.addEventSource(bucketEventSource);

    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new cdk.aws_s3_notifications.LambdaDestination(importFileParserLambda),
      { prefix: `${uploadCSVFolder}/` }
    );

    // gateway

    const api = new apigateway.RestApi(this, "ImportService", {
      // handler: importProductsFileLambda,
      //proxy: false,
      description: "ImportService REST API",
      defaultCorsPreflightOptions: {
        allowHeaders: ["*"],
        allowOrigins: ["*"],
        allowMethods: ["GET", "OPTIONS", "POST", "PUT"],
      },
    });

    // attach policies to lambdas
    //getProductsListLambda.addToRolePolicy(policyDynamoDBScan);

    // GET /import?name=
    const importRoot = api.root.addResource("import");
    // importRoot.addMethod("GET");

    // GET /import?name=
    // importRoot.addResource("{name}");
    importRoot.addMethod(
      "GET",
      new apigateway.LambdaIntegration(importProductsFileLambda),
      {
        requestParameters: {
          "method.request.querystring.name": true,
        },
      }
    );

    // POST /products/
    /*
    products.addMethod(
      "POST",
      new apigateway.LambdaIntegration(productPostLambda)
    );
    */
  }
}
