const os = require("os");

const ifaces = os.networkInterfaces();

export const getIp = () => {
  let localIp = "127.0.0.1";
  Object.keys(ifaces).forEach((ifname) => {
    for (const iface of ifaces[ifname]) {
      // Ignore IPv6 and 127.0.0.1
      if (iface.family !== "IPv4" || iface.internal !== false) {
        continue;
      }
      // Set the local ip to the first IPv4 address found and exit the loop
      localIp = iface.address;
      return;
    }
  });
  console.log(localIp);
  return localIp;
};

export const returnIps = () => {
  if (process.env.PUBLIC_IPS) {
    return (JSON.parse(process.env.PUBLIC_IPS) as string[]).map((e) => ({
      ip: "0.0.0.0",
      announcedIp: e,
    }));
  } else return [{ ip: "0.0.0.0", announcedIp: getIp() }];
};
