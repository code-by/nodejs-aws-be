export const buildResponse = (statusCode, body, headers = {}) => {
  const corrResolve = {
    "Access-Control-Allow-Credentials": true,
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
  };
  return {
    statusCode,
    headers: { ...headers, ...corrResolve },
    body: JSON.stringify(body),
  };
};
