import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNode from "aws-cdk-lib/aws-lambda-nodejs";
import * as dotenv from "dotenv";
dotenv.config();

import * as path from "path";
import { fileURLToPath } from "url";

export class AuthorizationServiceStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const __dirname = fileURLToPath(new URL("./", import.meta.url));

    const dotEnvConfig = dotenv.config();
    if (dotEnvConfig.error) {
      throw dotEnvConfig.error;
    }

    // get username for password TEST_PASSWORD from .env
    const authData = Object.entries(process.env).find(
      ([_, value]) => value == "TEST_PASSWORD"
    ) || ["", ""];

    const lambdaProps = {
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "handler",
      bundling: {
        format: lambdaNode.OutputFormat.ESM,
      },
      environment: {
        ...(authData && {
          [authData[0].replace(/_/g, "__").replace(/-/g, "_")]:
            authData[1] as string,
        }),
      },
    };

    // lambdas:
    new lambdaNode.NodejsFunction(this, "BasicAuthorizer", {
      functionName: "basicAuthorizer",
      entry: path.join(__dirname, "/authorization-service/basicAuthorizer.mjs"),
      ...lambdaProps,
    });
  }
}
