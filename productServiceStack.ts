import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambdaNode from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const commonLambdaProps = {
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "handler",
      bundling: {
        format: lambdaNode.OutputFormat.ESM,
      },
    };

    const getProductsListLambda = new lambdaNode.NodejsFunction(
      this,
      "ProductsListCDK",
      {
        functionName: "getProductsList",
        entry: path.join(__dirname, "/productServiceCDK/getProductsList.mjs"),
        ...commonLambdaProps,
      }
    );
    const getProductsByIdLambda = new lambdaNode.NodejsFunction(
      this,
      "ProductsByIdCDK",
      {
        functionName: "getProductsById",
        entry: path.join(__dirname, "/productServiceCDK/getProductsById.mjs"),
        ...commonLambdaProps,
      }
    );

    const api = new apigateway.LambdaRestApi(this, "ProductService", {
      handler: getProductsListLambda,
      proxy: false,
      description: "ProductService REST API",
      defaultCorsPreflightOptions: {
        allowHeaders: ["*"],
        allowOrigins: ["*"],
        allowMethods: ["GET", "OPTIONS"],
      },
    });

    // GET /products
    const products = api.root.addResource("products");
    products.addMethod("GET");

    // GET /products/{productId}
    const productsById = products.addResource("{productId}");
    productsById.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getProductsByIdLambda)
    );
  }
}
