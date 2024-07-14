const os = require("os");

export const getIp = () => {
  const networkInterfaces = os.networkInterfaces();
  let ipv4Address = "";

  for (const interfaceName in networkInterfaces) {
    const interfaceInfo = networkInterfaces[interfaceName];
    for (const alias of interfaceInfo) {
      if (alias.family === "IPv4" && !alias.internal) {
        ipv4Address = alias.address;
        break;
      }
    }
  }

  return ipv4Address;
};
