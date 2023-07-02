export const buildResponse = (statusCode, body, headers = {}) => {
  const corrsResolve = {
    "Access-Control-Allow-Credentials": true,
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
  };
  return {
    statusCode,
    headers: { ...headers, ...corrsResolve },
    body: JSON.stringify(body),
  };
};

export const getTablesNames = () => {
  console.log('getTablesNames');
  try {
    const { TABLE_PRODUCTS: tableProducts, TABLE_STOCKS: tableStocks } =
      process?.env || "";
    if (tableProducts && tableStocks) {
      console.log("tables names: ", tableProducts, tableStocks);
      return { tableProducts, tableStocks };
    } else {
      throw { message: "Server Configuration Error" };
    }
  } catch (e) {
    throw { message: "Server Configuration Error" };
  }
};
