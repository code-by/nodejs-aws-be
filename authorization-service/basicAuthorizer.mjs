const UNATHORIZED = "Unathorized";
const EFFECT_ALLOW = "Allow";
const EFFECT_DENY = "Deny";

const generatePolicy = (principalId, effect = EFFECT_ALLOW, methodArn) => ({
  principalId: principalId,
  policyDocument: {
    Version: "2012-10-17",
    Statement: [
      {
        Action: "execute-api:Invoke",
        Effect: effect,
        Resource: methodArn,
      },
    ],
  },
});

export const handler = async (event, _ctx, cb) => {
  if (event["type"] != "TOKEN") {
    cb(UNATHORIZED);
  }

  try {
    const authToken = event.authorizationToken;
    const authTokenArr = authToken.split(" ");
    const authTokenDecoded = Buffer.from(authTokenArr[1], "base64");
    const decodedTokenArr = authTokenDecoded.toString("utf-8").split(":");
    const [tokenUsername, tokenPassword] = decodedTokenArr;
    const userNameEncoded = tokenUsername
      .replace(/_/g, "__")
      .replace(/-/g, "_");

    const envUserPassword = process.env[userNameEncoded];
    const effect =
      !envUserPassword || envUserPassword != tokenPassword
        ? EFFECT_DENY
        : EFFECT_ALLOW;

    const policy = generatePolicy(authTokenArr[1], effect, event.methodArn);
    cb(null, policy);
  } catch (e) {
    console.log("some error happens");
    console.log(e);
    cb(`${UNATHORIZED}: ${e?.message || "unknown error"}`);
  }
};
