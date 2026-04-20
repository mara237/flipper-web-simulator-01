

configureServer(server: ViteDevServer) {
  // POST /logs: Browser sends logs (written directly to files)
  server.middlewares.use("/logs", (req, res, next) => {
    if (req.method !== "POST") {
      return next();
    }

    const handlePayload = (payload: any) => {
      // Write logs directly to files
      if (payload.consoleLogs?.length > 0) {
        writeToLogFile("browserConsole", payload.consoleLogs);
      }

      if (payload.networkRequests?.length > 0) {
        writeToLogFile("networkRequests", payload.networkRequests);
      }

      if (payload.sessionEvents?.length > 0) {
        writeToLogFile("sessionReplay", payload.sessionEvents);
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true }));
    };

    const reqBody = (req as { body?: unknown }).body;

    if (reqBody && typeof reqBody === "object") {
      try {
        handlePayload(reqBody);
      } catch (e) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: String(e) }));
      }
      return;
    }

    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const payload = JSON.parse(body);
        handlePayload(payload);
      } catch (e) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: String(e) }));
      }
    });
  });
},