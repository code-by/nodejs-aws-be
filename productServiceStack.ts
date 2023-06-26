import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambdaNode from "aws-cdk-lib/aws-lambda-nodejs";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import * as sns from "aws-cdk-lib/aws-sns";
import * as dotenv from "dotenv";
dotenv.config();

import * as path from "path";
import { fileURLToPath } from "url";

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const __dirname = fileURLToPath(new URL("./", import.meta.url));

    const dotEnvConfig = dotenv.config();
    if (dotEnvConfig.error) {
      throw dotEnvConfig.error;
    }

    const commonLambdaProps = {
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "handler",
      bundling: {
        format: lambdaNode.OutputFormat.ESM,
      },
      environment: {
        TABLE_PRODUCTS: "products",
        TABLE_STOCKS: "stocks",
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

    // lambdas:
    const getProductsByIdLambda = new lambdaNode.NodejsFunction(
      this,
      "ProductsByIdCDK",
      {
        functionName: "getProductsById",
        entry: path.join(__dirname, "/productServiceCDK/getProductsById.mjs"),
        ...commonLambdaProps,
      }
    );
    const productPostLambda = new lambdaNode.NodejsFunction(
      this,
      "ProductCreatePost",
      {
        functionName: "createProduct",
        entry: path.join(__dirname, "/productServiceCDK/createProduct.mjs"),
        ...commonLambdaProps,
      }
    );

    // SNS createProductTopic
    const createProductTopicSNS = new sns.Topic(this, "createProductTopic", {
      topicName: "CreateProductTopic",
      displayName: "AWS CloudShop",
    });

    // filters and emails
    const { SNS_ALL_PRODUCTS_EMAIL } = process.env;
    const { SNS_ALL_PRODUCTS_TITLE_BOOK } = process.env;
    const { SNS_ALL_PRODUCTS_EXPENSIVE } = process.env;

    console.info(createProductTopicSNS.topicArn);
    new sns.Subscription(this, "Product > Admin", {
      endpoint: SNS_ALL_PRODUCTS_EMAIL as string,
      protocol: sns.SubscriptionProtocol.EMAIL,
      topic: createProductTopicSNS,
    });

    // filter for title with Book word
    const filterPolicyTitle = {
      title: sns.SubscriptionFilter.stringFilter({
        matchPrefixes: ["Book"],
      }),
    };

    new sns.Subscription(this, "Product > Title: Book", {
      endpoint: SNS_ALL_PRODUCTS_TITLE_BOOK as string,
      protocol: sns.SubscriptionProtocol.EMAIL,
      topic: createProductTopicSNS,
      filterPolicy: filterPolicyTitle,
    });

    // subscription filter price >= 100
    const filterHighPrice = {
      price: sns.SubscriptionFilter.numericFilter({
        greaterThanOrEqualTo: 100,
      }),
    };

    new sns.Subscription(this, "Product > Boss", {
      endpoint: SNS_ALL_PRODUCTS_EXPENSIVE as string,
      protocol: sns.SubscriptionProtocol.EMAIL,
      topic: createProductTopicSNS,
      filterPolicy: filterHighPrice,
    });

    //

    const catalogBatchProcessLambda = new lambdaNode.NodejsFunction(
      this,
      "ProductBatchCreateSQS",
      {
        functionName: "catalogBatchProcess",
        entry: path.join(
          __dirname,
          "/productServiceCDK/catalogBatchProcess.mjs"
        ),
        ...commonLambdaProps,
        environment: {
          ...commonLambdaProps.environment,
          CREATE_PRODUCT_TOPIC_ARN: createProductTopicSNS.topicArn,
        },
      }
    );

    createProductTopicSNS.grantPublish(catalogBatchProcessLambda);

    // gateway:
    const api = new apigateway.LambdaRestApi(this, "ProductService", {
      handler: getProductsListLambda,
      proxy: false,
      description: "ProductService REST API",
      defaultCorsPreflightOptions: {
        allowHeaders: ["*"],
        allowOrigins: ["*"],
        allowMethods: ["GET", "OPTIONS", "POST", "PUT"],
      },
    });

    // policies
    const policyDynamoDBPutItem = new cdk.aws_iam.PolicyStatement({
      actions: ["dynamodb:PutItem"],
      resources: ["*"],
    });

    const policyDynamoDBScan = new cdk.aws_iam.PolicyStatement({
      actions: ["dynamodb:Scan", "dynamodb:GetItem"],
      resources: ["*"],
    });

    // attach policies to lambdas
    getProductsListLambda.addToRolePolicy(policyDynamoDBScan);
    getProductsByIdLambda.addToRolePolicy(policyDynamoDBScan);
    productPostLambda.addToRolePolicy(policyDynamoDBPutItem);
    catalogBatchProcessLambda.addToRolePolicy(policyDynamoDBPutItem);

    // GET /products
    const products = api.root.addResource("products");
    products.addMethod("GET");

    // GET /products/{productId}
    const productsById = products.addResource("{productId}");
    productsById.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getProductsByIdLambda)
    );

    // POST /products/
    products.addMethod(
      "POST",
      new apigateway.LambdaIntegration(productPostLambda)
    );

    // SQS
    const catalogItemsQueue = new sqs.Queue(this, "CatalogItemsQueue", {
      queueName: "CatalogItemsQueue",
    });

    // Configure the SQS catalogItemsQueue to trigger lambda catalogBatchProcess
    // with 5 messages at once via batchSize property.
    catalogBatchProcessLambda.addEventSource(
      new SqsEventSource(catalogItemsQueue, {
        batchSize: 5,
      })
    );
  }
}
