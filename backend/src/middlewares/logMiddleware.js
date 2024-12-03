const logMiddleware = async (req, res, next) => {
    // Capture request start time
    const start = Date.now();
  
    // Log request details
    const requestLog = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      query: req.query,
    };
  
    // Log the incoming request
    console.log(`[${requestLog.timestamp}] Incoming ${requestLog.method} ${requestLog.path}`);
    console.log('Request details:', requestLog);
  
    // Capture response data
    const originalSend = res.send;
    res.send = function (body) {
      res.send = originalSend;
      res.body = body;
      return res.send(body);
    };
  
    // Handle both successful requests and errors
    try {
      // Wait for the next middleware/route handler to complete
      await new Promise((resolve) => {
        res.on('finish', () => {
          const duration = Date.now() - start;
          console.log(`[${new Date().toISOString()}] Completed ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
          resolve();
        });
        next();
      });
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`[${new Date().toISOString()}] Error ${req.method} ${req.path} - ${error.message} (${duration}ms)`);
      next(error);
    }
  };
  
  export default logMiddleware;